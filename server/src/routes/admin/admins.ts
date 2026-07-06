import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware, superAdminMiddleware } from "../../lib/auth.js";
import { success, parsePagination } from "../../lib/api-utils.js";
import bcrypt from "bcryptjs";

export async function adminAdminsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/", async () => {
    const admins = await prisma.admin.findMany({ select: { id: true, username: true, nickname: true, isSuperAdmin: true, isActive: true, lastLoginAt: true, createdAt: true } });
    return success(admins);
  });

  app.post("/", { preHandler: [superAdminMiddleware] }, async (request) => {
    const { username, password, nickname } = request.body as any;
    const hashed = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({ data: { username, password: hashed, nickname } });
    return success({ id: admin.id, username: admin.username });
  });

  app.patch("/:id", { preHandler: [superAdminMiddleware] }, async (request) => {
    const { id } = request.params as { id: string };
    const { nickname, isActive } = request.body as any;
    const admin = await prisma.admin.update({ where: { id: parseInt(id) }, data: { ...(nickname && { nickname }), ...(isActive !== undefined && { isActive }) } });
    return success(admin);
  });

  app.delete("/:id", { preHandler: [superAdminMiddleware] }, async (request) => {
    const { id } = request.params as { id: string };
    await prisma.admin.delete({ where: { id: parseInt(id) } });
    return success(null);
  });
}
