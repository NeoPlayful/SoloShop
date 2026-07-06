import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success, error, parsePagination } from "../../lib/api-utils.js";
import { confirmSale, releaseCards } from "../../lib/card-pool.js";

export async function adminOrderRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/", async (request) => {
    const q = request.query as any;
    const { page, pageSize } = parsePagination(q);
    const where: any = {};
    if (q.orderNo) where.orderNo = { contains: q.orderNo };
    if (q.paymentStatus) where.paymentStatus = q.paymentStatus;
    if (q.deliveryStatus) where.deliveryStatus = q.deliveryStatus;
    if (q.productId) where.productId = parseInt(q.productId);

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { product: { select: { name: true } }, payments: { take: 1, orderBy: { createdAt: "desc" } } },
      }),
      prisma.order.count({ where }),
    ]);
    return success({ items, total, page, pageSize });
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { product: true, payments: true, deliveries: true, cards: { select: { id: true, content: true, batchNo: true } } },
    });
    if (!order) return reply.code(404).send(error("ORDER_NOT_FOUND", "订单不存在"));
    return success(order);
  });

  // 手动标记支付成功
  app.post("/:id/mark-paid", async (request) => {
    const { id } = request.params as { id: string };
    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!order) return error("ORDER_NOT_FOUND", "订单不存在");
    if (order.paymentStatus === "paid") return error("ORDER_ALREADY_PAID", "订单已支付");

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "paid", paidAt: new Date(), orderStatus: "completed" } });
      await tx.payment.create({ data: { orderId: order.id, channel: "manual", amount: order.totalAmount, paidAmount: order.totalAmount, status: "success", paidAt: new Date() } });
    });
    return success({ success: true });
  });

  // 重新发货
  app.post("/:id/redeliver", async (request) => {
    const { id } = request.params as { id: string };
    const delivery = await prisma.delivery.findFirst({ where: { orderId: parseInt(id) }, orderBy: { createdAt: "desc" } });
    if (!delivery) return error("DELIVERY_FAILED", "无发货记录");
    const newD = await prisma.delivery.create({ data: { orderId: delivery.orderId, type: delivery.type, content: delivery.content, status: "delivered", deliveredAt: new Date() } });
    return success(newD);
  });

  // 手动发货
  app.post("/:id/manual-deliver", async (request) => {
    const { id } = request.params as { id: string };
    const { content } = request.body as { content: string };
    const delivery = await prisma.delivery.create({ data: { orderId: parseInt(id), type: "manual", content, status: "delivered", deliveredAt: new Date() } });
    await prisma.order.update({ where: { id: parseInt(id) }, data: { deliveryStatus: "delivered", deliveredAt: new Date() } });
    return success(delivery);
  });

  // 关闭订单
  app.post("/:id/close", async (request) => {
    const { id } = request.params as { id: string };
    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!order) return error("ORDER_NOT_FOUND", "订单不存在");
    await prisma.order.update({ where: { id: order.id }, data: { orderStatus: "closed" } });
    // 释放卡密
    const lockedCards = await prisma.card.findMany({ where: { orderId: order.id, status: "locked" } });
    if (lockedCards.length > 0) {
      await releaseCards(lockedCards.map((c) => c.id), order.productId);
    }
    return success(null);
  });

  app.patch("/:id/note", async (request) => {
    const { id } = request.params as { id: string };
    const { note } = request.body as { note: string };
    await prisma.order.update({ where: { id: parseInt(id) }, data: { note } });
    return success(null);
  });

  app.get("/:id/logs", async (request) => {
    const { id } = request.params as { id: string };
    const logs = await prisma.operationLog.findMany({ where: { targetType: "order", targetId: parseInt(id) }, orderBy: { createdAt: "desc" } });
    return success(logs);
  });
}
