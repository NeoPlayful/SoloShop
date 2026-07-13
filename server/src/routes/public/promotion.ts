import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { success, error } from "../../lib/api-utils.js";
import { authMiddleware } from "../../lib/auth.js";

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

  // ─── 用户申请成为推广人 ───
  app.post("/apply", { preHandler: [authMiddleware] }, async (request, reply) => {
    const { userId } = (request as any).user;
    const body = request.body as { contact?: string };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { promotionInfo: true },
    });
    if (!user) return reply.code(404).send(error("VALIDATION_ERROR", "用户不存在"));
    if (user.role === "promoter" || user.promotionInfo) {
      return reply.code(400).send(error("VALIDATION_ERROR", "您已经是推广人"));
    }

    const isAdmin = user.role === "admin" || user.role === "super_admin";

    // 管理员：自动创建推广信息（自审批），不改变角色
    if (isAdmin) {
      const code = generateReferralCode();
      await prisma.promotionInfo.create({
        data: {
          userId: user.id,
          referralCode: code,
          commissionRate: 0.1,
        },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { contact: body.contact ?? user.contact },
      });
      return success({ autoApproved: true, referralCode: code });
    }

    // 普通用户：改为 promoter 角色，等待管理员审批
    await prisma.user.update({
      where: { id: userId },
      data: { role: "promoter", contact: body.contact ?? user.contact },
    });

    return success(null);
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
        createdAt: true,
        productSnapshot: true,
      },
    });

    return success(orders);
  });
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
