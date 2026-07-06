import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { success, error, AppError } from "../../lib/api-utils.js";
import { getAvailableStock } from "../../lib/card-pool.js";

export async function publicProductRoutes(app: FastifyInstance) {
  // 商品列表
  app.get("/", async (request) => {
    const q = request.query as { categoryId?: string; search?: string };
    const where: any = { status: "active", isHidden: false, deletedAt: null };
    if (q.categoryId) where.categoryId = parseInt(q.categoryId);
    if (q.search) where.name = { contains: q.search };

    const products = await prisma.product.findMany({
      where, orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, price: true, originalPrice: true, coverImage: true, salesCount: true, status: true, categoryId: true, minQuantity: true, maxQuantity: true },
    });
    return success(products);
  });

  // 商品详情
  app.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const product = await prisma.product.findFirst({
      where: { slug, status: "active", isHidden: false, deletedAt: null },
      include: { category: { select: { name: true } } },
    });
    if (!product) return reply.code(404).send(error("PRODUCT_NOT_FOUND", "商品不存在"));
    const stock = await getAvailableStock(product.id);
    return success({ ...product, stock });
  });
}
