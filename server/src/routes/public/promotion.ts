import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { success, error } from "../../lib/api-utils.js";

export async function publicPromotionRoutes(app: FastifyInstance) {
  // ─── 记录点击 ───
  app.post("/:code/click", async (request, reply) => {
    const { code } = request.params as { code: string };
    const info = await prisma.promotionInfo.findUnique({ where: { referralCode: code } });
    if (!info) {
      return reply.code(404).send(error("VALIDATION_ERROR", "推广码不存在"));
    }
    await prisma.promotionInfo.update({
      where: { id: info.id },
      data: { clickCount: { increment: 1 } },
    });
    return success({ referralCode: info.referralCode });
  });

  // ─── 推广人查看统计数据 ───
  app.get("/:code/stats", async (request, reply) => {
    const { code } = request.params as { code: string };
    const info = await prisma.promotionInfo.findUnique({
      where: { referralCode: code },
      include: { user: { select: { isActive: true } } },
    });
    if (!info) return reply.code(404).send(error("VALIDATION_ERROR", "推广码不存在"));
    if (!info.user.isActive) return reply.code(404).send(error("VALIDATION_ERROR", "推广已停用"));

    return success({
      referralCode: info.referralCode,
      commissionRate: info.commissionRate,
      clickCount: info.clickCount,
      orderCount: info.orderCount,
      totalSales: info.totalSales,
      totalCommission: info.totalCommission,
      createdAt: info.createdAt,
    });
  });

  // ─── 推广人查看自己的推广订单 ───
  app.get("/:code/orders", async (request, reply) => {
    const { code } = request.params as { code: string };
    const info = await prisma.promotionInfo.findUnique({ where: { referralCode: code } });
    if (!info) return reply.code(404).send(error("VALIDATION_ERROR", "推广码不存在"));

    const orders = await prisma.order.findMany({
      where: { referralCode: code },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        orderNo: true,
        totalAmount: true,
        commissionAmount: true,
        commissionStatus: true,
        paymentStatus: true,
        createdAt: true,
        productSnapshot: true,
      },
    });

    return success(orders);
  });
}
