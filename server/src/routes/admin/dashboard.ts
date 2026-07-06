import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success } from "../../lib/api-utils.js";

export async function adminDashboardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/overview", async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, todaySales, pendingPayment, pendingDeliveries, productCount, lowStock] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({ where: { createdAt: { gte: today }, paymentStatus: "paid" }, _sum: { totalAmount: true } }),
      prisma.order.count({ where: { paymentStatus: "unpaid", orderStatus: "pending" } }),
      prisma.order.count({ where: { deliveryStatus: "failed" } }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.card.count({ where: { status: "available" } }),
    ]);

    return success({
      todayOrders,
      todaySales: todaySales._sum.totalAmount || 0,
      pendingPayment,
      pendingDeliveries,
      productCount,
      lowStock,
    });
  });

  app.get("/recent-orders", async () => {
    const orders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true } } },
    });
    return success(orders);
  });
}
