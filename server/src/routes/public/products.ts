import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { success, error, AppError } from "../../lib/api-utils.js";

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

    // 批量统计可用库存
    const productIds = products.map((p) => p.id);
    const counts = productIds.length > 0 ? await prisma.card.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds }, status: "available" },
      _count: { id: true },
    }) : [];
    const stockMap = new Map(counts.map((c) => [c.productId, c._count.id]));
    const enriched = products.map((p) => ({ ...p, stock: stockMap.get(p.id) || 0 }));

    return success(enriched);
  });

  // 商品详情
  app.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const product = await prisma.product.findFirst({
      where: { slug, status: "active", isHidden: false, deletedAt: null },
      include: { category: { select: { name: true } } },
    });
    if (!product) return reply.code(404).send(error("PRODUCT_NOT_FOUND", "商品不存在"));
    const stock = await prisma.card.count({
      where: { productId: product.id, status: "available" },
    });
    return success({ ...product, stock });
  });
}
