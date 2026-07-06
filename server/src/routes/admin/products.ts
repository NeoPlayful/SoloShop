import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success, error, parsePagination } from "../../lib/api-utils.js";

export async function adminProductRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // 列表
  app.get("/", async (request) => {
    const q = request.query as { page?: string; pageSize?: string; search?: string; status?: string; categoryId?: string };
    const { page, pageSize } = parsePagination(q);

    const where: any = { deletedAt: null };
    if (q.search) where.name = { contains: q.search };
    if (q.status) where.status = q.status;
    if (q.categoryId) where.categoryId = parseInt(q.categoryId);

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { sortOrder: "asc" },
        include: { category: { select: { name: true } } },
      }),
      prisma.product.count({ where }),
    ]);
    return success({ items, total, page, pageSize });
  });

  // 创建
  app.post("/", async (request, reply) => {
    const body = request.body as any;
    if (!body.name || !body.categoryId) return reply.code(400).send(error("VALIDATION_ERROR", "商品名称和分类不能为空"));
    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    const product = await prisma.product.create({ data: { ...body, slug } });
    return success(product);
  });

  // 详情
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const product = await prisma.product.findFirst({ where: { id: parseInt(id), deletedAt: null }, include: { category: true } });
    if (!product) return reply.code(404).send(error("PRODUCT_NOT_FOUND", "商品不存在"));
    return success(product);
  });

  // 更新
  app.patch("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const product = await prisma.product.update({ where: { id: parseInt(id) }, data: body });
    return success(product);
  });

  // 软删除
  app.delete("/:id", async (request) => {
    const { id } = request.params as { id: string };
    await prisma.product.update({ where: { id: parseInt(id) }, data: { deletedAt: new Date(), status: "deleted" } });
    return success(null);
  });

  // 上架
  app.post("/:id/publish", async (request) => {
    const { id } = request.params as { id: string };
    const product = await prisma.product.update({ where: { id: parseInt(id) }, data: { status: "active" } });
    return success(product);
  });

  // 下架
  app.post("/:id/unpublish", async (request) => {
    const { id } = request.params as { id: string };
    const product = await prisma.product.update({ where: { id: parseInt(id) }, data: { status: "inactive" } });
    return success(product);
  });

  // 复制
  app.post("/:id/duplicate", async (request) => {
    const { id } = request.params as { id: string };
    const original = await prisma.product.findUnique({ where: { id: parseInt(id) } });
    if (!original) return { success: false };
    const product = await prisma.product.create({
      data: {
        name: original.name + " (副本)", slug: original.slug + "-copy-" + Date.now(),
        categoryId: original.categoryId, price: original.price, deliveryType: original.deliveryType,
        status: "draft", minQuantity: original.minQuantity, maxQuantity: original.maxQuantity,
      },
    });
    return success(product);
  });

  // 统计
  app.get("/:id/stats", async (request) => {
    const { id } = request.params as { id: string };
    const pid = parseInt(id);
    const [available, locked, sold] = await Promise.all([
      prisma.card.count({ where: { productId: pid, status: "available" } }),
      prisma.card.count({ where: { productId: pid, status: "locked" } }),
      prisma.card.count({ where: { productId: pid, status: "sold" } }),
    ]);
    return success({ available, locked, sold, total: available + locked + sold });
  });
}
