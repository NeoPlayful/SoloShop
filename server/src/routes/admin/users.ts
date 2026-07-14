import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware, superAdminMiddleware } from "../../lib/auth.js";
import { success, error, parsePagination } from "../../lib/api-utils.js";
import bcrypt from "bcryptjs";

export async function adminUsersRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // ─── 用户列表 ───
  app.get("/", async (request) => {
    const query = request.query as { role?: string; page?: string; pageSize?: string };
    const where: Record<string, unknown> = { deletedAt: null };
    if (query.role) where.role = query.role;

    const { page, pageSize } = parsePagination(query);
    const total = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    return success({ items: users, total, page, pageSize });
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
    if (!body.email) return reply.code(400).send(error("VALIDATION_ERROR", "邮箱不能为空"));

    // 检查 email 或 username 唯一性
    const emailExists = await prisma.user.findUnique({ where: { email: body.email } });
    if (emailExists) return reply.code(400).send(error("VALIDATION_ERROR", "邮箱已存在"));
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
      username?: string;
      password?: string;
      email?: string;
      contact?: string;
      role?: string;
      isActive?: boolean;
      remark?: string;
      referralCode?: string;
      commissionRate?: number;
    };

    const existing = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return reply.code(404).send(error("VALIDATION_ERROR", "用户不存在"));

    // 检查 email 唯一性
    if (body.email && body.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({ where: { email: body.email } });
      if (emailExists) return reply.code(400).send(error("VALIDATION_ERROR", "邮箱已存在"));
    }
    // 检查 username 唯一性
    if (body.username && body.username !== existing.username) {
      const nameExists = await prisma.user.findUnique({ where: { username: body.username } });
      if (nameExists) return reply.code(400).send(error("VALIDATION_ERROR", "用户名已存在"));
    }

    const data: Record<string, unknown> = {};
    if (body.username !== undefined) data.username = body.username;
    if (body.password) data.password = await bcrypt.hash(body.password, 10);
    if (body.email !== undefined) data.email = body.email;
    if (body.contact !== undefined) data.contact = body.contact;
    if (body.role !== undefined) data.role = body.role;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.remark !== undefined) data.remark = body.remark;

    const user = await prisma.user.update({ where: { id: parseInt(id) }, data });

    // 角色变更时联动处理推广信息
    if (body.role === "promoter" && body.role !== existing.role) {
      // 变为推广人 — 创建 promotionInfo（如不存在）
      const existingPromotion = await prisma.promotionInfo.findUnique({ where: { userId: user.id } });
      if (!existingPromotion) {
        const code = body.referralCode || generateReferralCode();
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
    } else if (body.role === "promoter" && body.commissionRate !== undefined) {
      // 已经是推广人，更新佣金比例
      await prisma.promotionInfo.updateMany({
        where: { userId: user.id },
        data: { commissionRate: body.commissionRate },
      });
    }

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

  // ─── 删除用户（软删除） ───
  app.delete("/:id", { preHandler: [superAdminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { orders: true } } },
    });
    if (!existing) return reply.code(404).send(error("VALIDATION_ERROR", "用户不存在"));
    if (existing.role === "super_admin")
      return reply.code(400).send(error("VALIDATION_ERROR", "不能删除超级管理员"));
    if (existing.deletedAt) return success(null);

    // 软删除：设置删除时间，保留邮箱原样
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date(), isActive: false },
    });
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
