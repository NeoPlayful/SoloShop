import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success, error, parsePagination } from "../../lib/api-utils.js";
import { redis, key } from "../../lib/cache.js";

export async function adminCardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // 列表
  app.get("/", async (request) => {
    const q = request.query as { page?: string; pageSize?: string; productId?: string; status?: string; batchNo?: string; search?: string };
    const { page, pageSize } = parsePagination(q);
    const where: any = {};
    if (q.productId) where.productId = parseInt(q.productId);
    if (q.status) where.status = q.status;
    if (q.batchNo) where.batchNo = q.batchNo;

    const [items, total] = await Promise.all([
      prisma.card.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { product: { select: { name: true } } },
      }),
      prisma.card.count({ where }),
    ]);
    // 默认脱敏
    const masked = items.map((c) => ({ ...c, content: c.content.length > 8 ? c.content.substring(0, 4) + "****" : "****" }));
    return success({ items: masked, total, page, pageSize });
  });

  // 单条新增
  app.post("/", async (request, reply) => {
    const body = request.body as { productId: number; content: string; batchNo?: string };
    if (!body.productId || !body.content) return reply.code(400).send(error("VALIDATION_ERROR", "商品ID和卡密内容不能为空"));
    const card = await prisma.card.create({ data: { productId: body.productId, content: body.content, batchNo: body.batchNo } });
    // 同步 Redis
    await redis.sadd(key("card", "pool", String(body.productId)), card.id);
    return success(card);
  });

  // 批量导入
  app.post("/import", async (request, reply) => {
    const body = request.body as { productId: number; contents: string[]; batchNo?: string };
    if (!body.productId || !body.contents?.length) return reply.code(400).send(error("VALIDATION_ERROR", "参数错误"));

    const data = body.contents.map((content) => ({ productId: body.productId, content: content.trim(), batchNo: body.batchNo }));
    const result = await prisma.card.createMany({ data });
    // 重新加载 Redis 池
    const cards = await prisma.card.findMany({ where: { productId: body.productId, status: "available" }, select: { id: true } });
    await redis.del(key("card", "pool", String(body.productId)));
    if (cards.length > 0) await redis.sadd(key("card", "pool", String(body.productId)), ...cards.map((c) => c.id));
    return success({ count: result.count });
  });

  // 详情（脱敏）
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const card = await prisma.card.findUnique({ where: { id: parseInt(id) } });
    if (!card) return reply.code(404).send(error("CARD_NOT_FOUND", "卡密不存在"));
    return success({ ...card, content: card.content.length > 8 ? card.content.substring(0, 4) + "****" : "****" });
  });

  // 查看完整卡密
  app.get("/:id/reveal", async (request) => {
    const { id } = request.params as { id: string };
    const card = await prisma.card.findUnique({ where: { id: parseInt(id) } });
    if (!card) return success(null);
    // 记录日志
    await prisma.operationLog.create({
      data: { adminId: (request as any).admin?.adminId, action: "card.reveal", targetType: "card", targetId: card.id, detail: { content: card.content } },
    });
    return success({ content: card.content });
  });

  // 更新
  app.patch("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const { content, batchNo } = request.body as { content?: string; batchNo?: string };
    const card = await prisma.card.update({ where: { id: parseInt(id) }, data: { ...(content && { content }), ...(batchNo && { batchNo }) } });
    return success(card);
  });

  // 删除
  app.delete("/:id", async (request) => {
    const { id } = request.params as { id: string };
    await prisma.card.delete({ where: { id: parseInt(id) } });
    return success(null);
  });

  // 禁用
  app.post("/:id/disable", async (request) => {
    const { id } = request.params as { id: string };
    const card = await prisma.card.update({ where: { id: parseInt(id) }, data: { status: "disabled" } });
    return success(card);
  });

  // 启用
  app.post("/:id/enable", async (request) => {
    const { id } = request.params as { id: string };
    const card = await prisma.card.update({ where: { id: parseInt(id) }, data: { status: "available" } });
    await redis.sadd(key("card", "pool", String(card.productId)), card.id);
    return success(card);
  });

  // 批量删除
  app.post("/batch-delete", async (request) => {
    const { ids } = request.body as { ids: number[] };
    if (!ids?.length) return error("VALIDATION_ERROR", "参数错误");
    await prisma.card.deleteMany({ where: { id: { in: ids } } });
    return success(null);
  });

  // 库存统计
  app.get("/stats", async (request) => {
    const q = request.query as { productId?: string };
    const where: any = {};
    if (q.productId) where.productId = parseInt(q.productId);
    const [available, locked, sold, disabled] = await Promise.all([
      prisma.card.count({ where: { ...where, status: "available" } }),
      prisma.card.count({ where: { ...where, status: "locked" } }),
      prisma.card.count({ where: { ...where, status: "sold" } }),
      prisma.card.count({ where: { ...where, status: "disabled" } }),
    ]);
    return success({ available, locked, sold, disabled });
  });

  // 批次列表
  app.get("/batches", async () => {
    const batches = await prisma.card.findMany({
      where: { batchNo: { not: null } },
      select: { batchNo: true, productId: true },
      distinct: ["batchNo", "productId"],
    });
    return success(batches);
  });

  // 删除批次
  app.delete("/batches/:batchNo", async (request) => {
    const { batchNo } = request.params as { batchNo: string };
    await prisma.card.deleteMany({ where: { batchNo, status: { not: "sold" } } });
    return success(null);
  });
}
