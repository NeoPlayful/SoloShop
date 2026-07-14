import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success, parsePagination } from "../../lib/api-utils.js";

export async function adminPaymentChannelRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/", async (request) => {
    const { page, pageSize } = parsePagination(request.query as { page?: string; pageSize?: string });
    const total = await prisma.paymentChannel.count();
    const channels = await prisma.paymentChannel.findMany({
      orderBy: { sortOrder: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const masked = channels.map((c) => ({ ...c, config: maskConfig(c.code, c.config as any) }));
    return success({ items: masked, total, page, pageSize });
  });

  app.get("/:code", async (request) => {
    const { code } = request.params as { code: string };
    const channel = await prisma.paymentChannel.findUnique({ where: { code } });
    // GET 单个渠道返回完整 config（已在 authMiddleware 保护下）
    return success(channel);
  });

  app.patch("/:code", async (request) => {
    const { code } = request.params as { code: string };
    const body = request.body as { config?: any; name?: string; sortOrder?: number };

    // 构建更新数据
    const data: Record<string, any> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;

    // config 采用合并模式：只替换提交的字段，保留未提交的字段
    if (body.config !== undefined) {
      const existing = await prisma.paymentChannel.findUnique({ where: { code } });
      const mergedConfig = { ...(existing?.config as any || {}), ...body.config };
      data.config = mergedConfig;
    }

    const channel = await prisma.paymentChannel.update({ where: { code }, data });
    return success(channel);
  });

  app.post("/:code/enable", async (request) => {
    const { code } = request.params as { code: string };
    const channel = await prisma.paymentChannel.update({ where: { code }, data: { isEnabled: true } });
    return success(channel);
  });

  app.post("/:code/disable", async (request) => {
    const { code } = request.params as { code: string };
    const channel = await prisma.paymentChannel.update({ where: { code }, data: { isEnabled: false } });
    return success(channel);
  });
}

function maskConfig(code: string, config: Record<string, any>): Record<string, any> {
  const masked = { ...config };
  for (const key of Object.keys(masked)) {
    if (key.toLowerCase().includes("key") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("password")) {
      masked[key] = masked[key] ? masked[key].substring(0, 4) + "****" : "";
    }
  }
  return masked;
}
