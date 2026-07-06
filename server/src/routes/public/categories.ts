import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";

export async function publicCategoryRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    const categories = await prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { status: "active", isHidden: false, deletedAt: null } } } } },
    });
    return { success: true, data: categories };
  });
}
