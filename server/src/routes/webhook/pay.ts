import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { confirmSale } from "../../lib/card-pool.js";
import { createOrderLog } from "../../lib/order-log.js";
import { sendMail, renderTemplate } from "../../lib/mailer.js";
import { verifyEpayCallback, isTradeSuccess } from "../../lib/epay.js";
import type { EpayConfig } from "../../lib/epay.js";

// ─── 支付完成通用处理（复用逻辑） ───

async function completePayment(orderId: number, channel: string, paidAmount?: number) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  if (order.paymentStatus === "paid") return; // 幂等

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "paid",
        paidAt: new Date(),
        orderStatus: "completed",
      },
    });

    await tx.payment.updateMany({
      where: { orderId, isActive: true },
      data: {
        status: "success",
        paidAmount: paidAmount ?? order.totalAmount,
        paidAt: new Date(),
      },
    });

    // ─── 推广佣金处理 ───
    if (order.referralCode) {
      const info = await tx.promotionInfo.findUnique({ where: { referralCode: order.referralCode } });
      if (info) {
        const promoter = await tx.user.findUnique({ where: { id: info.userId } });
        if (promoter && promoter.isActive && promoter.role !== "buyer") {
          const maxSetting = await tx.systemSetting.findUnique({ where: { key: "promotion_max_commission_per_order" } });
          const maxCommission = maxSetting ? Number(maxSetting.value) : null;

          let commission = Number(order.totalAmount) * Number(info.commissionRate);
          let commissionAmount = Math.round(commission * 100) / 100;

          if (maxCommission !== null && maxCommission > 0) {
            commissionAmount = Math.min(commissionAmount, Number(maxCommission));
          }

          await tx.order.update({ where: { id: orderId }, data: { commissionAmount, commissionStatus: "pending" } });
          await tx.promotionInfo.update({
            where: { id: info.id },
            data: {
              orderCount: { increment: 1 },
              totalSales: { increment: Number(order.totalAmount) },
              totalCommission: { increment: commissionAmount },
            },
          });
        }
      }
    }
  });

  // ─── 记录支付成功日志 ───
  await createOrderLog({
    orderId,
    eventType: "payment.success",
    message: `支付成功，金额 ¥${Number(paidAmount ?? order.totalAmount).toFixed(2)}`,
    metadata: { channel, amount: paidAmount ?? order.totalAmount },
  });

  // ─── 发货 ───
  const cards = await prisma.card.findMany({ where: { orderId, status: "locked" } });
  if (cards.length > 0) {
    await confirmSale(cards.map((c) => c.id));
    const content = cards.map((c) => c.content).join("\n");
    const delivery = await prisma.delivery.create({
      data: { orderId, type: "card", content, status: "delivered", deliveredAt: new Date() },
    });
    await prisma.order.update({ where: { id: orderId }, data: { deliveryStatus: "delivered", deliveredAt: new Date() } });
    await prisma.product.update({ where: { id: order.productId }, data: { salesCount: { increment: order.quantity } } });

    await createOrderLog({
      orderId,
      eventType: "card.delivered",
      message: `自动发卡 ${cards.length} 条`,
      metadata: { deliveryId: delivery.id, cardCount: cards.length, content },
    });

    // ─── 发送卡密邮件 ───
    try {
      const siteSetting = await prisma.systemSetting.findUnique({ where: { key: "site_name" } });
      const siteName = String(siteSetting?.value || "SoloShop");
      const snapshot = (order.productSnapshot || {}) as { name?: string };
      const productName = snapshot.name || "—";
      const cardKeys = cards.map((c) => c.content).join("\n");
      const rendered = await renderTemplate("email_template_order_paid", {
        siteName,
        orderNo: order.orderNo,
        productName,
        quantity: String(order.quantity),
        cardKeys,
      });
      if (rendered && order.buyerEmail) {
        await sendMail({ to: order.buyerEmail, subject: rendered.subject, html: rendered.html });
        await createOrderLog({
          orderId,
          eventType: "email.sent",
          message: `发卡邮件已发送至 ${order.buyerEmail}`,
          metadata: { to: order.buyerEmail, template: "email_template_order_paid" },
        });
      }
    } catch (err: any) {
      await createOrderLog({
        orderId,
        eventType: "email.failed",
        message: `发卡邮件发送失败: ${err.message || "未知错误"}`,
        metadata: { error: err.message, to: order.buyerEmail },
      });
    }
  }

  // ─── 记录订单完成日志 ───
  await createOrderLog({
    orderId,
    eventType: "order.completed",
    message: "订单已完成",
  });

  // ─── 记录佣金日志 ───
  const updatedOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { commissionAmount: true },
  });
  const amount = updatedOrder?.commissionAmount ? Number(updatedOrder.commissionAmount) : 0;
  if (amount > 0) {
    await createOrderLog({
      orderId,
      eventType: "commission.pending",
      message: `佣金待结算 ¥${amount.toFixed(2)}`,
      metadata: { commissionAmount: amount },
    });
  }
}

export async function webhookPayRoutes(app: FastifyInstance) {
  // ─── mock 支付回调 ───
  app.post("/mock", async (request, reply) => {
    const { orderNo } = request.body as { orderNo: string };
    const order = await prisma.order.findUnique({ where: { orderNo } });
    if (!order) return reply.code(404).send({ success: false });
    if (order.paymentStatus === "paid") return { success: true };

    await completePayment(order.id, "mock");

    return { success: true };
  });

  // ─── 易支付异步通知 ───
  app.post("/epay", async (request, reply) => {
    const body = request.body as Record<string, string>;

    // 查找渠道配置（按 epay / alipay / wxpay 的顺序尝试）
    const channelCode = body.type === "wxpay" ? "wxpay" : body.type === "alipay" ? "alipay" : "epay";
    const channelConfig = await prisma.paymentChannel.findUnique({ where: { code: channelCode } });

    // 如果没有完全匹配的渠道，尝试用 epay 的配置
    const config = channelConfig?.config as any || {};
    const epayConfig: EpayConfig = {
      apiUrl: config.apiUrl || process.env.EPAY_API_URL || "",
      pid: config.pid || process.env.EPAY_PID || "",
      key: config.key || process.env.EPAY_KEY || "",
    };

    // 验证签名
    if (!verifyEpayCallback(epayConfig, body)) {
      return reply.code(400).send("sign verification failed");
    }

    // 检查交易状态
    if (!isTradeSuccess(body)) {
      return reply.send("success"); // 交易未成功，但仍返回 success 避免重复通知
    }

    const orderNo = body.out_trade_no;
    const tradeNo = body.trade_no || "";
    const money = body.money || "0";

    const order = await prisma.order.findUnique({ where: { orderNo } });
    if (!order) return reply.code(404).send("order not found");
    if (order.paymentStatus === "paid") return reply.send("success"); // 幂等

    // 更新支付记录的渠道订单号
    await prisma.payment.updateMany({
      where: { orderId: order.id, isActive: true },
      data: { channelOrderNo: tradeNo },
    });

    await completePayment(order.id, channelCode, Number(money));

    // 必须返回 success 字符串，易支付需要此响应
    return reply.send("success");
  });
}
