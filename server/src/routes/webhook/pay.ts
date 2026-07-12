import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { confirmSale } from "../../lib/card-pool.js";
import { createOrderLog } from "../../lib/order-log.js";

export async function webhookPayRoutes(app: FastifyInstance) {
  // mock支付回调
  app.post("/mock", async (request, reply) => {
    const { orderNo } = request.body as { orderNo: string };
    const order = await prisma.order.findUnique({ where: { orderNo } });
    if (!order) return reply.code(404).send({ success: false });
    if (order.paymentStatus === "paid") return { success: true };

    // 事务处理
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "paid", paidAt: new Date(), orderStatus: "completed" } });
      await tx.payment.updateMany({ where: { orderId: order.id, isActive: true }, data: { status: "success", paidAmount: order.totalAmount, paidAt: new Date() } });

      // ─── 推广佣金处理 ───
      if (order.referralCode) {
        const info = await tx.promotionInfo.findUnique({ where: { referralCode: order.referralCode } });
        if (info) {
          // 检查推广人是否有效
          const promoter = await tx.user.findUnique({ where: { id: info.userId } });
          if (promoter && promoter.isActive && promoter.role !== "buyer") {
            // 读取单笔佣金上限设置
            const maxSetting = await tx.systemSetting.findUnique({ where: { key: "promotion_max_commission_per_order" } });
            const maxCommission = maxSetting ? Number(maxSetting.value) : null;

            // 计算佣金（按比例）
            let commission = Number(order.totalAmount) * Number(info.commissionRate);
            let commissionAmount = Math.round(commission * 100) / 100;

            // 如果设置了上限，取较小值
            if (maxCommission !== null && maxCommission > 0) {
              commissionAmount = Math.min(commissionAmount, Number(maxCommission));
            }

            await tx.order.update({ where: { id: order.id }, data: { commissionAmount, commissionStatus: "pending" } });
            await tx.promotionInfo.update({ where: { id: info.id }, data: {
              orderCount: { increment: 1 },
              totalSales: { increment: Number(order.totalAmount) },
              totalCommission: { increment: commissionAmount },
            } });
          }
        }
      }
    });

    // ─── 记录支付成功日志 ───
    await createOrderLog({
      orderId: order.id,
      eventType: "payment.success",
      message: `支付成功，金额 ¥${Number(order.totalAmount).toFixed(2)}`,
      metadata: { channel: "mock", amount: order.totalAmount },
    });

    // 发货
    const cards = await prisma.card.findMany({ where: { orderId: order.id, status: "locked" } });
    if (cards.length > 0) {
      await confirmSale(cards.map((c) => c.id));
      const content = cards.map((c) => c.content).join("\n");
      const delivery = await prisma.delivery.create({ data: { orderId: order.id, type: "card", content, status: "delivered", deliveredAt: new Date() } });
      await prisma.order.update({ where: { id: order.id }, data: { deliveryStatus: "delivered", deliveredAt: new Date() } });
      // 更新销量
      await prisma.product.update({ where: { id: order.productId }, data: { salesCount: { increment: order.quantity } } });

      // ─── 记录自动发卡日志 ───
      await createOrderLog({
        orderId: order.id,
        eventType: "card.delivered",
        message: `自动发卡 ${cards.length} 条`,
        metadata: { deliveryId: delivery.id, cardCount: cards.length, content },
      });
    }

    // ─── 记录订单完成日志 ───
    await createOrderLog({
      orderId: order.id,
      eventType: "order.completed",
      message: "订单已完成",
    });

    // ─── 记录佣金日志 ───
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      select: { commissionAmount: true },
    });
    const amount = updatedOrder?.commissionAmount ? Number(updatedOrder.commissionAmount) : 0;
    if (amount > 0) {
      await createOrderLog({
        orderId: order.id,
        eventType: "commission.pending",
        message: `佣金待结算 ¥${amount.toFixed(2)}`,
        metadata: { commissionAmount: amount },
      });
    }

    return { success: true };
  });
}
