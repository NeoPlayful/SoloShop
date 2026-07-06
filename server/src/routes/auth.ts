import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db.js";
import { signToken, authMiddleware } from "../lib/auth.js";
import { success, error, AppError } from "../lib/api-utils.js";

export async function authRoutes(app: FastifyInstance) {
  // 登录
  app.post("/login", async (request, reply) => {
    const { username, password } = request.body as { username?: string; password?: string };
    if (!username || !password) {
      return reply.code(400).send(error("VALIDATION_ERROR", "用户名和密码不能为空"));
    }

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin || !admin.isActive) {
      return reply.code(401).send(error("UNAUTHORIZED", "用户名或密码错误"));
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return reply.code(401).send(error("UNAUTHORIZED", "用户名或密码错误"));
    }

    const token = await signToken({
      adminId: admin.id,
      username: admin.username,
      isSuperAdmin: admin.isSuperAdmin,
    });

    // 更新最后登录时间
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    reply.setCookie("token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
    });

    return success({
      admin: { id: admin.id, username: admin.username, nickname: admin.nickname, isSuperAdmin: admin.isSuperAdmin },
    });
  });

  // 退出登录
  app.post("/logout", async (_request, reply) => {
    reply.clearCookie("token", { path: "/" });
    return success(null);
  });

  // 获取当前管理员信息
  app.get("/me", { preHandler: [authMiddleware] }, async (request) => {
    const { adminId } = (request as any).admin;
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new AppError(404, "UNAUTHORIZED", "管理员不存在");
    return success({
      id: admin.id,
      username: admin.username,
      nickname: admin.nickname,
      isSuperAdmin: admin.isSuperAdmin,
    });
  });

  // 修改密码
  app.post("/change-password", { preHandler: [authMiddleware] }, async (request, reply) => {
    const { adminId } = (request as any).admin;
    const { oldPassword, newPassword } = request.body as { oldPassword?: string; newPassword?: string };

    if (!oldPassword || !newPassword) {
      return reply.code(400).send(error("VALIDATION_ERROR", "旧密码和新密码不能为空"));
    }
    if (newPassword.length < 6) {
      return reply.code(400).send(error("VALIDATION_ERROR", "新密码至少6位"));
    }

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new AppError(404, "UNAUTHORIZED", "管理员不存在");

    const valid = await bcrypt.compare(oldPassword, admin.password);
    if (!valid) {
      return reply.code(400).send(error("VALIDATION_ERROR", "旧密码错误"));
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({ where: { id: adminId }, data: { password: hashed } });

    return success(null);
  });

  // 获取权限（管理员列表和角色信息）
  app.get("/permissions", { preHandler: [authMiddleware] }, async (request) => {
    const { isSuperAdmin } = (request as any).admin;
    if (!isSuperAdmin) throw new AppError(403, "FORBIDDEN", "无权限");
    const admins = await prisma.admin.findMany({ select: { id: true, username: true, nickname: true, isSuperAdmin: true, isActive: true } });
    return success(admins);
  });
}
