import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success, parsePagination } from "../../lib/api-utils.js";

export async function adminSecurityRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/ip-blacklist", async (request) => {
    const q = request.query as any;
    const { page, pageSize } = parsePagination(q);
    return success({ items: [], total: 0, page, pageSize });
  });

  app.post("/ip-blacklist", async (request) => {
    const { ip, reason } = request.body as any;
    return success({ ip, reason });
  });

  app.delete("/ip-blacklist/:id", async (request) => {
    return success(null);
  });
}
