import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success, parsePagination } from "../../lib/api-utils.js";

export async function adminPaymentRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/", async (request) => {
    const q = request.query as any;
    const { page, pageSize } = parsePagination(q);
    const where: any = {};

    if (q.status) where.status = q.status;
    if (q.channel) where.channel = q.channel;
    if (q.orderNo) {
      where.order = { orderNo: { contains: q.orderNo } };
    }
    // 时间区间筛选（按支付时间）
    if (q.paidAtFrom) where.paidAt = { ...where.paidAt, gte: new Date(q.paidAtFrom) };
    if (q.paidAtTo) where.paidAt = { ...where.paidAt, lte: new Date(q.paidAtTo) };

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { order: { select: { orderNo: true } } },
      }),
      prisma.payment.count({ where }),
    ]);

    // 汇总统计（当前筛选条件下）
    const [successCount, pendingCount, failedCount, amountResult] = await Promise.all([
      prisma.payment.count({ where: { ...where, status: "success" } }),
      prisma.payment.count({ where: { ...where, status: "pending" } }),
      prisma.payment.count({ where: { ...where, status: "failed" } }),
      prisma.payment.aggregate({
        where: { ...where, status: "success" },
        _sum: { paidAmount: true },
      }),
    ]);

    return success({
      items,
      total,
      page,
      pageSize,
      stats: {
        total,
        successCount,
        pendingCount,
        failedCount,
        totalPaidAmount: amountResult._sum.paidAmount,
      },
    });
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: { order: { select: { orderNo: true } } },
    });
    if (!payment) return reply.code(404).send({ success: false });
    return success(payment);
  });
}
