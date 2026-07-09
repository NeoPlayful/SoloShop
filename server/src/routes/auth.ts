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

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) {
      return reply.code(401).send(error("UNAUTHORIZED", "用户名或密码错误"));
    }
    // 只有 admin/super_admin 角色可登录后台
    if (user.role !== "admin" && user.role !== "super_admin") {
      return reply.code(403).send(error("FORBIDDEN", "无后台登录权限"));
    }

    const valid = await bcrypt.compare(password, user.password || "");
    if (!valid) {
      return reply.code(401).send(error("UNAUTHORIZED", "用户名或密码错误"));
    }

    const token = await signToken({
      userId: user.id,
      username: user.username || "",
      role: user.role,
    });

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    reply.setCookie("token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
    });

    return success({
      user: { id: user.id, username: user.username, role: user.role },
    });
  });

  // 退出登录
  app.post("/logout", async (_request, reply) => {
    reply.clearCookie("token", { path: "/" });
    return success(null);
  });

  // 获取当前用户信息
  app.get("/me", { preHandler: [authMiddleware] }, async (request) => {
    const { userId } = (request as any).user;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, "UNAUTHORIZED", "用户不存在");
    return success({
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
    });
  });

  // 修改密码
  app.post("/change-password", { preHandler: [authMiddleware] }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { oldPassword, newPassword } = request.body as { oldPassword?: string; newPassword?: string };

    if (!oldPassword || !newPassword) {
      return reply.code(400).send(error("VALIDATION_ERROR", "旧密码和新密码不能为空"));
    }
    if (newPassword.length < 6) {
      return reply.code(400).send(error("VALIDATION_ERROR", "新密码至少6位"));
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, "UNAUTHORIZED", "用户不存在");

    const valid = await bcrypt.compare(oldPassword, user.password || "");
    if (!valid) {
      return reply.code(400).send(error("VALIDATION_ERROR", "旧密码错误"));
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    return success(null);
  });
}
