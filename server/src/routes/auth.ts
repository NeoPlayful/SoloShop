import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db.js";
import { signToken, authMiddleware } from "../lib/auth.js";
import { success, error, AppError } from "../lib/api-utils.js";

export async function authRoutes(app: FastifyInstance) {
  // 登录（支持用户名或邮箱）
  app.post("/login", async (request, reply) => {
    const { username, password } = request.body as { username?: string; password?: string };
    if (!username || !password) {
      return reply.code(400).send(error("VALIDATION_ERROR", "用户名/邮箱和密码不能为空"));
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
      },
    });
    if (!user || !user.isActive) {
      return reply.code(401).send(error("UNAUTHORIZED", "用户名/邮箱或密码错误"));
    }
    if (!user.password) {
      return reply.code(401).send(error("UNAUTHORIZED", "该用户未设置密码，请先注册"));
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return reply.code(401).send(error("UNAUTHORIZED", "用户名/邮箱或密码错误"));
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
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  });

  // ─── 用户注册 ───
  app.post("/register", async (request, reply) => {
    const body = request.body as { username?: string; email?: string; password?: string };

    if (!body.username || !body.email || !body.password) {
      return reply.code(400).send(error("VALIDATION_ERROR", "用户名、邮箱和密码不能为空"));
    }
    if (body.password.length < 6) {
      return reply.code(400).send(error("VALIDATION_ERROR", "密码至少6位"));
    }

    // 检查用户名唯一性
    const existingUsername = await prisma.user.findUnique({ where: { username: body.username } });
    if (existingUsername) {
      return reply.code(400).send(error("VALIDATION_ERROR", "用户名已被使用"));
    }

    // 检查邮箱 — 已有无密码记录则补全，有密码则拒绝
    const existingEmail = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingEmail) {
      if (existingEmail.password) {
        return reply.code(400).send(error("VALIDATION_ERROR", "邮箱已被注册"));
      }
      // 下单时 upsert 的无密码用户，补全信息
      const hashed = await bcrypt.hash(body.password, 10);
      const user = await prisma.user.update({
        where: { id: existingEmail.id },
        data: {
          username: body.username,
          password: hashed,
        },
      });
      const token = await signToken({ userId: user.id, username: user.username || "", role: user.role });
      reply.setCookie("token", token, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 24 * 60 * 60 });
      return success({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    }

    // 正常创建新用户
    const hashed = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email,
        password: hashed,
        role: "buyer",
      },
    });

    const token = await signToken({ userId: user.id, username: user.username || "", role: user.role });
    reply.setCookie("token", token, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 24 * 60 * 60 });
    return success({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  });

  // 退出登录
  app.post("/logout", async (_request, reply) => {
    reply.clearCookie("token", { path: "/" });
    return success(null);
  });

  // 获取当前用户信息
  app.get("/me", { preHandler: [authMiddleware] }, async (request) => {
    const { userId } = (request as any).user;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        promotionInfo: {
          select: {
            id: true,
            referralCode: true,
            commissionRate: true,
            clickCount: true,
            orderCount: true,
            totalSales: true,
            totalCommission: true,
          },
        },
      },
    });
    if (!user) throw new AppError(404, "UNAUTHORIZED", "用户不存在");
    return success({
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      promotionInfo: user.promotionInfo,
    });
  });

  // 更新个人信息（联系方式）
  app.patch("/profile", { preHandler: [authMiddleware] }, async (request, reply) => {
    const { userId } = (request as any).user;
    const body = request.body as { contact?: string };

    const user = await prisma.user.update({
      where: { id: userId },
      data: { contact: body.contact ?? undefined },
    });

    return success({ contact: user.contact });
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
