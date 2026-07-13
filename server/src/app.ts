import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import staticFiles from "@fastify/static";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { redis } from "./lib/cache.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { healthRoutes } from "./routes/system/health.js";
import { authRoutes } from "./routes/auth.js";
import { adminCategoryRoutes } from "./routes/admin/categories.js";
import { adminProductRoutes } from "./routes/admin/products.js";
import { adminCardRoutes } from "./routes/admin/cards.js";
import { adminDashboardRoutes } from "./routes/admin/dashboard.js";
import { adminOrderRoutes } from "./routes/admin/orders.js";
import { adminPaymentRoutes } from "./routes/admin/payments.js";
import { adminDeliveryRoutes } from "./routes/admin/deliveries.js";
import { adminPaymentChannelRoutes } from "./routes/admin/payment-channels.js";
import { adminSettingsRoutes } from "./routes/admin/settings.js";
import { adminUsersRoutes } from "./routes/admin/users.js";
import { adminLogRoutes } from "./routes/admin/logs.js";
import { adminSecurityRoutes } from "./routes/admin/security.js";
import { adminUploadRoutes } from "./routes/admin/upload.js";
import { adminPromotionRoutes } from "./routes/admin/promotion.js";
import { adminWithdrawalRequestRoutes } from "./routes/admin/withdrawal-requests.js";
import { publicSettingsRoutes } from "./routes/public/settings.js";
import { publicCategoryRoutes } from "./routes/public/categories.js";
import { publicProductRoutes } from "./routes/public/products.js";
import { publicOrderRoutes } from "./routes/public/orders.js";
import { publicPaymentRoutes } from "./routes/public/payment.js";
import { publicPromotionRoutes } from "./routes/public/promotion.js";
import { webhookPayRoutes } from "./routes/webhook/pay.js";
import { merchantWithdrawalRoutes } from "./routes/merchant/withdrawal.js";

const envToLogger: Record<string, object> = {
  development: { level: "info" },
  production: { level: "warn" },
  test: { level: "silent" },
};

const env = process.env.NODE_ENV || "development";

const app = Fastify({
  logger: envToLogger[env] || true,
});

// ─── 插件注册 ───
await app.register(cors, {
  origin: true,
  credentials: true,
});

await app.register(cookie, {
  secret: process.env.JWT_SECRET || "dev-secret",
  parseOptions: {},
});

await app.register(multipart, {
  limits: { fileSize: 10 * 1024 * 1024 },
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
  keyGenerator: (request) => request.ip,
});

// ─── 静态文件服务 ───
await app.register(staticFiles, {
  root: join(__dirname, "../uploads"),
  prefix: "/uploads/",
  decorateReply: false,
});

// ─── Prisma 客户端 ───
const prisma = new PrismaClient();
app.decorate("prisma", prisma);

// ─── 路由注册 ───
await app.register(healthRoutes, { prefix: "/api/system" });
await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(adminCategoryRoutes, { prefix: "/api/admin/categories" });
await app.register(adminProductRoutes, { prefix: "/api/admin/products" });
await app.register(adminCardRoutes, { prefix: "/api/admin/cards" });
await app.register(adminDashboardRoutes, { prefix: "/api/admin/dashboard" });
await app.register(adminOrderRoutes, { prefix: "/api/admin/orders" });
await app.register(adminPaymentRoutes, { prefix: "/api/admin/payments" });
await app.register(adminDeliveryRoutes, { prefix: "/api/admin/deliveries" });
await app.register(adminPaymentChannelRoutes, { prefix: "/api/admin/payment-channels" });
await app.register(adminSettingsRoutes, { prefix: "/api/admin/settings" });
await app.register(adminUsersRoutes, { prefix: "/api/admin/users" });
await app.register(adminLogRoutes, { prefix: "/api/admin/logs" });
await app.register(adminSecurityRoutes, { prefix: "/api/admin/security" });
await app.register(adminUploadRoutes, { prefix: "/api/admin/upload" });
await app.register(adminPromotionRoutes, { prefix: "/api/admin/promotion" });
await app.register(adminWithdrawalRequestRoutes, { prefix: "/api/admin/withdrawal-requests" });
await app.register(publicSettingsRoutes, { prefix: "/api/public/settings" });
await app.register(publicCategoryRoutes, { prefix: "/api/public/categories" });
await app.register(publicProductRoutes, { prefix: "/api/public/products" });
await app.register(publicOrderRoutes, { prefix: "/api/public/orders" });
await app.register(publicPaymentRoutes, { prefix: "/api/public/payment" });
await app.register(publicPromotionRoutes, { prefix: "/api/public/promotion" });
await app.register(webhookPayRoutes, { prefix: "/api/webhook/pay" });
await app.register(merchantWithdrawalRoutes, { prefix: "/api/merchant/withdrawal" });

// ─── 启动 ───
const start = async () => {
  try {
    await prisma.$connect();
    app.log.info("✅ 数据库连接成功");

    try {
      await redis.ping();
      app.log.info("✅ Redis 连接成功");
    } catch (e) {
      app.log.warn("⚠️ Redis 连接失败，限流和卡密池功能不可用");
    }

    const port = parseInt(process.env.PORT || "4000");
    const host = process.env.HOST || "0.0.0.0";
    await app.listen({ port, host });
    app.log.info(`🚀 SoloShop API 启动成功: http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

export { app, prisma };
