import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success } from "../../lib/api-utils.js";

export async function adminDashboardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/overview", async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, todaySales, pendingPayment, pendingDeliveries, productCount, lowStock, totalOrders, totalSales] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({ where: { createdAt: { gte: today }, paymentStatus: "paid" }, _sum: { totalAmount: true } }),
      prisma.order.count({ where: { paymentStatus: "unpaid", orderStatus: "pending" } }),
      prisma.order.count({ where: { deliveryStatus: "failed" } }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.card.count({ where: { status: "available" } }),
      prisma.order.count(),
      prisma.order.aggregate({ where: { paymentStatus: "paid" }, _sum: { totalAmount: true } }),
    ]);

    return success({
      todayOrders,
      todaySales: todaySales._sum.totalAmount || 0,
      pendingPayment,
      pendingDeliveries,
      productCount,
      lowStock,
      totalOrders,
      totalSales: totalSales._sum.totalAmount || 0,
    });
  });

  app.get<{ Querystring: { days?: string } }>("/trend", async (req) => {
    const days = Math.min(Math.max(parseInt(req.query.days || "7", 10) || 7, 1), 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate }, paymentStatus: "paid" },
      select: { createdAt: true, totalAmount: true },
    });

    // 按日期聚合
    const map = new Map<string, { orderCount: number; sales: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { orderCount: 0, sales: 0 });
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const entry = map.get(key);
      if (entry) {
        entry.orderCount++;
        entry.sales += Number(o.totalAmount);
      }
    }

    const trend = Array.from(map.entries()).map(([date, data]) => ({ date, ...data }));
    return success(trend);
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
