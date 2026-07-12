import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success, parsePagination } from "../../lib/api-utils.js";
import { createOrderLog } from "../../lib/order-log.js";

export async function adminDeliveryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/", async (request) => {
    const q = request.query as any;
    const { page, pageSize } = parsePagination(q);
    const where: any = {};
    if (q.status) where.status = q.status;
    const [items, total] = await Promise.all([
      prisma.delivery.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: "desc" }, include: { order: { select: { orderNo: true } } } }),
      prisma.delivery.count({ where }),
    ]);
    return success({ items, total, page, pageSize });
  });

  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const delivery = await prisma.delivery.findUnique({ where: { id: parseInt(id) } });
    return success(delivery);
  });

  app.post("/:id/retry", async (request) => {
    const { id } = request.params as { id: string };
    const adminUser = (request as any).user?.username || "unknown";
    const delivery = await prisma.delivery.update({ where: { id: parseInt(id) }, data: { status: "delivered", retryCount: { increment: 1 }, deliveredAt: new Date() } });

    await createOrderLog({
      orderId: delivery.orderId,
      eventType: "delivery.retried",
      message: `管理员 ${adminUser} 重试发货`,
      operator: adminUser,
    });

    return success(delivery);
  });
}
