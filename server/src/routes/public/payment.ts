import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { createOrderLog } from "../../lib/order-log.js";
import { createEpayOrder, getEpayType } from "../../lib/epay.js";
import type { EpayConfig } from "../../lib/epay.js";

export async function publicPaymentRoutes(app: FastifyInstance) {
  // 可用支付渠道
  app.get("/channels", async () => {
    const channels = await prisma.paymentChannel.findMany({ where: { isEnabled: true }, orderBy: { sortOrder: "asc" } });
    return { success: true, data: channels.map((c) => ({ code: c.code, name: c.name })) };
  });

  // 获取站点 URL（用于回调通知地址）
  function getSiteUrl(request: any): string {
    const envUrl = process.env.SITE_URL;
    if (envUrl) return envUrl;
    const host = request.headers["host"] || "localhost:4000";
    return `${request.protocol || "http"}://${host}`;
  }

  // ─── 真实支付渠道：alipay / wxpay / epay ───
  async function handleEpayPayment(
    order: any,
    channel: string,
    config: any,
    siteUrl: string,
  ) {
    const notifyUrl = `${siteUrl}/api/webhook/pay/epay`;
    const epayConfig: EpayConfig = {
      apiUrl: config.apiUrl || process.env.EPAY_API_URL || "",
      pid: config.pid || process.env.EPAY_PID || "",
      key: config.key || process.env.EPAY_KEY || "",
    };

    const snapshot = (order.productSnapshot || {}) as { name?: string };
    const result = await createEpayOrder(epayConfig, {
      type: getEpayType(channel),
      outTradeNo: order.orderNo,
      name: snapshot.name || `Order ${order.orderNo}`,
      money: String(Number(order.totalAmount).toFixed(2)),
      notifyUrl,
      siteName: "SoloShop",
    });

    if (result.code !== 1) {
      throw new Error(result.msg || "支付创建失败");
    }

    return { payUrl: result.payurl, qrcode: result.qrcode };
  }

  // 创建支付
  app.post("/create", async (request, reply) => {
    const { orderNo, channel } = request.body as { orderNo: string; channel: string };
    const order = await prisma.order.findUnique({ where: { orderNo } });
    if (!order) return reply.code(404).send({ success: false, error: { code: "ORDER_NOT_FOUND", message: "订单不存在" } });
    if (order.paymentStatus === "paid") return reply.code(400).send({ success: false, error: { code: "ORDER_ALREADY_PAID", message: "订单已支付" } });

    // 查找渠道配置
    const channelConfig = await prisma.paymentChannel.findUnique({ where: { code: channel } });
    const isEpayChannel = ["alipay", "wxpay", "epay"].includes(channel);

    let payUrl: string;
    let qrcode: string | undefined;

    if (isEpayChannel && channelConfig?.config) {
      // 真实支付：通过易支付创建订单
      const config = channelConfig.config as any;
      const siteUrl = getSiteUrl(request);
      const epayResult = await handleEpayPayment(order, channel, config, siteUrl);
      payUrl = epayResult.payUrl;
      qrcode = epayResult.qrcode;
    } else {
      // 模拟支付
      payUrl = `/mock/pay?orderNo=${orderNo}&amount=${order.totalAmount}&channel=${channel}`;
    }

    // 创建支付记录（pending）
    await prisma.payment.create({
      data: {
        orderId: order.id,
        channel,
        amount: order.totalAmount,
        status: "pending",
        isActive: true,
      },
    });

    // 记录支付发起日志
    await createOrderLog({
      orderId: order.id,
      eventType: "payment.initiated",
      message: `发起支付：${channel}`,
      metadata: { channel, amount: order.totalAmount },
    });

    return { success: true, data: { payUrl, qrcode, orderNo, amount: order.totalAmount, isEpay: isEpayChannel } };
  });

  // 支付状态轮询
  app.get("/status/:orderNo", async (request) => {
    const { orderNo } = request.params as { orderNo: string };
    const order = await prisma.order.findUnique({ where: { orderNo }, select: { paymentStatus: true, orderStatus: true } });
    return { success: true, data: order };
  });
}
