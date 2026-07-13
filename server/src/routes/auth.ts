import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db.js";
import { signToken, authMiddleware } from "../lib/auth.js";
import { success, error, AppError } from "../lib/api-utils.js";
import { redis, key } from "../lib/cache.js";
import { sendMail, renderTemplate } from "../lib/mailer.js";

export async function authRoutes(app: FastifyInstance) {
  // SMTP 状态检查
  app.get("/smtp-status", async () => {
    const setting = await prisma.systemSetting.findUnique({ where: { key: "email_enabled" } });
    return success({ enabled: setting?.value === true });
  });

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

    reply.setCookie("soloshop_token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
    });

    return success({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  });

  // ─── 发送注册验证码 ───
  app.post("/send-register-code", async (request, reply) => {
    const { email } = request.body as { email?: string };
    if (!email) {
      return reply.code(400).send(error("VALIDATION_ERROR", "邮箱不能为空"));
    }

    try {
      // 检查 SMTP 是否启用
      const smtpSetting = await prisma.systemSetting.findUnique({ where: { key: "email_enabled" } });
      if (smtpSetting?.value !== true) {
        return reply.code(400).send(error("SMTP_DISABLED", "邮件服务未启用"));
      }

      // 检查邮箱是否已被注册
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing?.password) {
        return reply.code(400).send(error("VALIDATION_ERROR", "邮箱已被注册"));
      }

      // 检查 60 秒内是否已发过
      const sentKey = key("register_code_sent", email);
      const recent = await redis.get(sentKey);
      if (recent) {
        return reply.code(429).send(error("RATE_LIMIT", "请勿频繁发送，请 60 秒后再试"));
      }

      // 生成 6 位验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeKey = key("register_code", email);

      // 渲染模板
      const siteSetting = await prisma.systemSetting.findUnique({ where: { key: "site_name" } });
      const siteName = String(siteSetting?.value || "SoloShop");
      const rendered = await renderTemplate("email_template_register_code", {
        siteName,
        code,
      });

      // 检查模板是否存在
      if (!rendered) {
        return reply.code(500).send(error("TEMPLATE_ERROR", "注册验证码邮件模板未配置"));
      }

      // 先发送邮件
      await sendMail({ to: email, subject: rendered.subject, html: rendered.html });

      // 邮件发送成功后，再写入 Redis
      await redis.set(codeKey, code, "EX", 600);
      await redis.set(sentKey, "1", "EX", 60);

      return success({ message: "验证码已发送" });
    } catch (err: any) {
      // 分类处理错误
      const errMsg = err?.message || "";

      if (errMsg.includes("邮件") || errMsg.includes("SMTP") || errMsg.includes("mail")) {
        return reply.code(500).send(error("EMAIL_ERROR", "验证码发送失败，请检查邮件配置"));
      }

      if (errMsg.includes("Redis") || errMsg.includes("redis")) {
        return reply.code(500).send(error("CACHE_ERROR", "验证码服务暂时不可用，请稍后重试"));
      }

      return reply.code(500).send(error("UNKNOWN_ERROR", "验证码发送失败，请稍后重试"));
    }
  });

  // ─── 用户注册 ───
  app.post("/register", async (request, reply) => {
    const body = request.body as { username?: string; email?: string; password?: string; code?: string };

    if (!body.username || !body.email || !body.password) {
      return reply.code(400).send(error("VALIDATION_ERROR", "用户名、邮箱和密码不能为空"));
    }
    if (body.password.length < 6) {
      return reply.code(400).send(error("VALIDATION_ERROR", "密码至少6位"));
    }

    // SMTP 启用时校验验证码
    const smtpSetting = await prisma.systemSetting.findUnique({ where: { key: "email_enabled" } });
    if (smtpSetting?.value === true) {
      if (!body.code) {
        return reply.code(400).send(error("VALIDATION_ERROR", "验证码不能为空"));
      }
      const codeKey = key("register_code", body.email);
      const storedCode = await redis.get(codeKey);
      // 无论成功失败都删除，防止重放
      await redis.del(codeKey);
      if (storedCode !== body.code) {
        return reply.code(400).send(error("VALIDATION_ERROR", "验证码错误或已过期"));
      }
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
      reply.setCookie("soloshop_token", token, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 24 * 60 * 60 });
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
    reply.setCookie("soloshop_token", token, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 24 * 60 * 60 });
    return success({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  });

  // 退出登录
  app.post("/logout", async (_request, reply) => {
    reply.clearCookie("soloshop_token", { path: "/" });
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
