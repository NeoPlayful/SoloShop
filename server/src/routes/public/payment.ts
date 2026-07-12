import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { createOrderLog } from "../../lib/order-log.js";

export async function publicPaymentRoutes(app: FastifyInstance) {
  // 可用支付渠道
  app.get("/channels", async () => {
    const channels = await prisma.paymentChannel.findMany({ where: { isEnabled: true }, orderBy: { sortOrder: "asc" } });
    return { success: true, data: channels.map((c) => ({ code: c.code, name: c.name })) };
  });

  // 创建支付
  app.post("/create", async (request, reply) => {
    const { orderNo, channel } = request.body as { orderNo: string; channel: string };
    const order = await prisma.order.findUnique({ where: { orderNo } });
    if (!order) return reply.code(404).send({ success: false, error: { code: "ORDER_NOT_FOUND", message: "订单不存在" } });
    if (order.paymentStatus === "paid") return reply.code(400).send({ success: false, error: { code: "ORDER_ALREADY_PAID", message: "订单已支付" } });

    // 模拟支付创建
    const payUrl = `/mock/pay?orderNo=${orderNo}&amount=${order.totalAmount}&channel=${channel}`;

    // 创建支付记录（pending）
    const payment = await prisma.payment.create({
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
      metadata: { channel, amount: order.totalAmount, paymentId: payment.id },
    });

    return { success: true, data: { payUrl, orderNo, amount: order.totalAmount } };
  });

  // 支付状态轮询
  app.get("/status/:orderNo", async (request) => {
    const { orderNo } = request.params as { orderNo: string };
    const order = await prisma.order.findUnique({ where: { orderNo }, select: { paymentStatus: true, orderStatus: true } });
    return { success: true, data: order };
  });
}
