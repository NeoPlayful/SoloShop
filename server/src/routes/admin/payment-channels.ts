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
    return success(channel ? { ...channel, config: maskConfig(channel.code, channel.config as any) } : null);
  });

  app.patch("/:code", async (request) => {
    const { code } = request.params as { code: string };
    const { config } = request.body as { config: any };
    const channel = await prisma.paymentChannel.update({ where: { code }, data: { config } });
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
