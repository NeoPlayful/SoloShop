import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success, parsePagination } from "../../lib/api-utils.js";

export async function adminLogRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/operation", async (request) => {
    const q = request.query as any;
    const { page, pageSize } = parsePagination(q);
    const where: any = {};
    if (q.action) where.action = { contains: q.action };
    if (q.targetType) where.targetType = q.targetType;
    const [items, total] = await Promise.all([
      prisma.operationLog.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: "desc" }, include: { user: { select: { username: true, name: true } } } }),
      prisma.operationLog.count({ where }),
    ]);
    return success({ items, total, page, pageSize });
  });

  app.get("/login", async (request) => {
    const q = request.query as any;
    const { page, pageSize } = parsePagination(q);
    const [items, total] = await Promise.all([
      prisma.operationLog.findMany({ where: { action: { contains: "login" } }, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: "desc" } }),
      prisma.operationLog.count({ where: { action: { contains: "login" } } }),
    ]);
    return success({ items, total, page, pageSize });
  });
}
