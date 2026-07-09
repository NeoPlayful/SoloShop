import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success, error } from "../../lib/api-utils.js";
import bcrypt from "bcryptjs";

export async function adminPromotionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // ─── 推广人列表（含 User + PromotionInfo） ───
  app.get("/", async () => {
    const promoters = await prisma.user.findMany({
      where: { role: "promoter" },
      select: {
        id: true,
        contact: true,
        email: true,
        isActive: true,
        createdAt: true,
        promotionInfo: {
          select: {
            id: true,
            referralCode: true,
            commissionRate: true,
            clickCount: true,
            orderCount: true,
            totalSales: true,
            totalCommission: true,
            createdAt: true,
          },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return success(promoters);
  });

  // ─── 创建推广人（User + PromotionInfo） ───
  app.post("/", async (request, reply) => {
    const body = request.body as {
      contact?: string;
      email?: string;
      commissionRate?: number;
      referralCode?: string;
    };

    const code = body.referralCode || generateReferralCode();
    const existingCode = await prisma.promotionInfo.findUnique({ where: { referralCode: code } });
    if (existingCode) return reply.code(400).send(error("VALIDATION_ERROR", "推广码已存在"));

    if (body.email) {
      const existing = await prisma.user.findUnique({ where: { email: body.email } });
      if (existing) return reply.code(400).send(error("VALIDATION_ERROR", "邮箱已存在"));
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        contact: body.contact,
        role: "promoter",
      },
    });

    const info = await prisma.promotionInfo.create({
      data: {
        userId: user.id,
        referralCode: code,
        commissionRate: body.commissionRate ?? 0.1,
      },
    });

    return success({
      id: user.id,
      email: user.email,
      referralCode: info.referralCode,
      commissionRate: info.commissionRate,
    });
  });

  // ─── 获取推广详情 ───
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id), role: "promoter" },
      select: {
        id: true,
        contact: true,
        email: true,
        isActive: true,
        promotionInfo: true,
      },
    });
    if (!user) return reply.code(404).send(error("VALIDATION_ERROR", "推广人不存在"));
    return success(user);
  });

  // ─── 更新推广设置（只改推广信息，不改用户基本信息） ───
  app.patch("/:id/settings", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      commissionRate?: number;
    };

    const user = await prisma.user.findUnique({ where: { id: parseInt(id), role: "promoter" } });
    if (!user) return reply.code(404).send(error("VALIDATION_ERROR", "推广人不存在"));

    const info = await prisma.promotionInfo.findUnique({ where: { userId: user.id } });
    if (!info) return reply.code(404).send(error("VALIDATION_ERROR", "推广信息不存在"));

    const data: Record<string, unknown> = {};
    if (body.commissionRate !== undefined) data.commissionRate = body.commissionRate;

    const updated = await prisma.promotionInfo.update({ where: { id: info.id }, data });
    return success(updated);
  });

  // ─── 删除推广人 ───
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id: parseInt(id), role: "promoter" } });
    if (!user) return reply.code(404).send(error("VALIDATION_ERROR", "推广人不存在"));

    // 删除推广信息
    await prisma.promotionInfo.deleteMany({ where: { userId: user.id } });
    // 删除用户
    await prisma.user.delete({ where: { id: user.id } });
    return success(null);
  });

  // ─── 禁用推广人 ───
  app.post("/:id/disable", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.user.findUnique({ where: { id: parseInt(id), role: "promoter" } });
    if (!existing) return reply.code(404).send(error("VALIDATION_ERROR", "推广人不存在"));
    await prisma.user.update({ where: { id: parseInt(id) }, data: { isActive: false } });
    return success(null);
  });

  // ─── 启用推广人 ───
  app.post("/:id/enable", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.user.findUnique({ where: { id: parseInt(id), role: "promoter" } });
    if (!existing) return reply.code(404).send(error("VALIDATION_ERROR", "推广人不存在"));
    await prisma.user.update({ where: { id: parseInt(id) }, data: { isActive: true } });
    return success(null);
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
