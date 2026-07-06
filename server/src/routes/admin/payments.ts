import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success, parsePagination } from "../../lib/api-utils.js";

export async function adminPaymentRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/", async (request) => {
    const q = request.query as any;
    const { page, pageSize } = parsePagination(q);
    const [items, total] = await Promise.all([
      prisma.payment.findMany({ skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: "desc" }, include: { order: { select: { orderNo: true } } } }),
      prisma.payment.count(),
    ]);
    return success({ items, total, page, pageSize });
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const payment = await prisma.payment.findUnique({ where: { id: parseInt(id) } });
    if (!payment) return reply.code(404).send({ success: false });
    return success(payment);
  });
}
