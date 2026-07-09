import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware, superAdminMiddleware } from "../../lib/auth.js";
import { success, error } from "../../lib/api-utils.js";
import bcrypt from "bcryptjs";

export async function adminUsersRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // ─── 用户列表 ───
  app.get("/", async (request) => {
    const query = request.query as { role?: string };
    const where: Record<string, unknown> = {};
    if (query.role) where.role = query.role;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        contact: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        remark: true,
        createdAt: true,
        promotionInfo: {
          select: {
            referralCode: true,
            commissionRate: true,
            clickCount: true,
            orderCount: true,
            totalSales: true,
            totalCommission: true,
          },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return success(users);
  });

  // ─── 创建用户（管理员或推广人） ───
  app.post("/", { preHandler: [superAdminMiddleware] }, async (request, reply) => {
    const body = request.body as {
      username?: string;
      password?: string;
      email?: string;
      contact?: string;
      role: string;
      remark?: string;
      // 推广相关
      referralCode?: string;
      commissionRate?: number;
    };

    if (!body.role) return reply.code(400).send(error("VALIDATION_ERROR", "角色不能为空"));

    // 检查 email 或 username 唯一性
    if (body.email) {
      const exists = await prisma.user.findUnique({ where: { email: body.email } });
      if (exists) return reply.code(400).send(error("VALIDATION_ERROR", "邮箱已存在"));
    }
    if (body.username) {
      const exists = await prisma.user.findUnique({ where: { username: body.username } });
      if (exists) return reply.code(400).send(error("VALIDATION_ERROR", "用户名已存在"));
    }

    const hashedPassword = body.password ? await bcrypt.hash(body.password, 10) : undefined;

    const user = await prisma.user.create({
      data: {
        username: body.username,
        password: hashedPassword,
        email: body.email,
        contact: body.contact,
        role: body.role,
        remark: body.remark,
      },
    });

    // 如果是推广人角色，自动创建推广信息
    if (body.role === "promoter") {
      const code = body.referralCode || generateReferralCode();
      // 检查 code 唯一性
      const existingCode = await prisma.promotionInfo.findUnique({ where: { referralCode: code } });
      if (existingCode) return reply.code(400).send(error("VALIDATION_ERROR", "推广码已存在"));

      await prisma.promotionInfo.create({
        data: {
          userId: user.id,
          referralCode: code,
          commissionRate: body.commissionRate ?? 0.1,
        },
      });
    }

    return success({ id: user.id, username: user.username, role: user.role });
  });

  // ─── 更新用户 ───
  app.patch("/:id", { preHandler: [superAdminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      contact?: string;
      isActive?: boolean;
      remark?: string;
      email?: string;
    };

    const existing = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return reply.code(404).send(error("VALIDATION_ERROR", "用户不存在"));

    const data: Record<string, unknown> = {};
    if (body.contact !== undefined) data.contact = body.contact;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.remark !== undefined) data.remark = body.remark;
    if (body.email !== undefined) data.email = body.email;

    const user = await prisma.user.update({ where: { id: parseInt(id) }, data });
    return success({ id: user.id, username: user.username, role: user.role });
  });

  // ─── 禁用用户 ───
  app.post("/:id/disable", { preHandler: [superAdminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return reply.code(404).send(error("VALIDATION_ERROR", "用户不存在"));
    await prisma.user.update({ where: { id: parseInt(id) }, data: { isActive: false } });
    return success(null);
  });

  // ─── 启用用户 ───
  app.post("/:id/enable", { preHandler: [superAdminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return reply.code(404).send(error("VALIDATION_ERROR", "用户不存在"));
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
