import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { redis } from "../../lib/cache.js";
import { success, error } from "../../lib/api-utils.js";

async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_request, _reply) => {
    const checks: Record<string, string> = {};

    // 检查数据库
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = "ok";
    } catch {
      checks.database = "error";
    }

    // 检查 Redis
    try {
      await redis.ping();
      checks.redis = "ok";
    } catch {
      checks.redis = "error";
    }

    const isHealthy = Object.values(checks).every((s) => s === "ok");

    if (isHealthy) {
      return success({ status: "healthy", checks, timestamp: new Date().toISOString() });
    }

    return error("SYSTEM_ERROR", "服务状态异常");
  });
}

export { healthRoutes };
