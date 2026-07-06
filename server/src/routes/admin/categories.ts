import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success, error, AppError, parsePagination } from "../../lib/api-utils.js";

export async function adminCategoryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // 列表
  app.get("/", async (request) => {
    const query = request.query as { page?: string; pageSize?: string };
    const { page, pageSize } = parsePagination(query);

    const [items, total] = await Promise.all([
      prisma.category.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: true } } },
      }),
      prisma.category.count(),
    ]);

    return success({ items, total, page, pageSize });
  });

  // 创建
  app.post("/", async (request, reply) => {
    const body = request.body as { name: string; slug?: string; description?: string; sortOrder?: number };
    if (!body.name) return reply.code(400).send(error("VALIDATION_ERROR", "分类名称不能为空"));

    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, "-");
    const category = await prisma.category.create({
      data: { name: body.name, slug, description: body.description, sortOrder: body.sortOrder || 0 },
    });
    return success(category);
  });

  // 详情
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const category = await prisma.category.findUnique({ where: { id: parseInt(id) } });
    if (!category) return reply.code(404).send(error("PRODUCT_NOT_FOUND", "分类不存在"));
    return success(category);
  });

  // 更新
  app.patch("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; slug?: string; description?: string; sortOrder?: number; isVisible?: boolean };
    const category = await prisma.category.update({ where: { id: parseInt(id) }, data: body });
    return success(category);
  });

  // 删除
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const productCount = await prisma.product.count({ where: { categoryId: parseInt(id) } });
    if (productCount > 0) return reply.code(400).send(error("VALIDATION_ERROR", "该分类下有商品，无法删除"));
    await prisma.category.delete({ where: { id: parseInt(id) } });
    return success(null);
  });

  // 启用
  app.post("/:id/enable", async (request) => {
    const { id } = request.params as { id: string };
    const category = await prisma.category.update({ where: { id: parseInt(id) }, data: { isVisible: true } });
    return success(category);
  });

  // 禁用
  app.post("/:id/disable", async (request) => {
    const { id } = request.params as { id: string };
    const category = await prisma.category.update({ where: { id: parseInt(id) }, data: { isVisible: false } });
    return success(category);
  });

  // 排序
  app.patch("/sort", async (request) => {
    const { items } = request.body as { items: { id: number; sortOrder: number }[] };
    if (!items) return error("VALIDATION_ERROR", "参数错误");
    await Promise.all(items.map((item) => prisma.category.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })));
    return success(null);
  });
}
