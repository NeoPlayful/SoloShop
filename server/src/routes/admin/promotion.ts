import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success, error } from "../../lib/api-utils.js";

export async function adminPromotionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // ─── 推广总览统计 ───
  app.get("/overview", async () => {
    const [promoterCount, pendingCount, aggregations] = await Promise.all([
      // 有推广信息的用户，不限角色（含管理员）
      prisma.user.count({ where: { promotionInfo: { isNot: null } } }),
      // 已申请推广但尚未审批的（role=promoter 且无 promotionInfo）
      prisma.user.count({ where: { role: "promoter", promotionInfo: null } }),
      prisma.promotionInfo.aggregate({
        _sum: { clickCount: true, orderCount: true, totalSales: true, totalCommission: true },
      }),
    ]);

    return success({
      promoterCount,
      pendingCount,
      totalSales: aggregations._sum.totalSales ?? 0,
      totalCommission: aggregations._sum.totalCommission ?? 0,
      totalClicks: aggregations._sum.clickCount ?? 0,
      totalOrders: aggregations._sum.orderCount ?? 0,
    });
  });

  // ─── 推广人列表（含 User + PromotionInfo，支持搜索/筛选/分页） ───
  app.get("/", async (request) => {
    const query = request.query as {
      search?: string;
      status?: string;
      page?: string;
      pageSize?: string;
    };

    const page = Math.max(1, parseInt(query.page || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || "20")));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    // 基础过滤：推广人角色 或 有推广信息的用户
    const promoterFilter = [
      { role: "promoter" },
      { promotionInfo: { isNot: null } },
    ];

    // 搜索：按邮箱或推广码
    if (query.search) {
      where.AND = [
        { OR: promoterFilter },
        {
          OR: [
            { email: { contains: query.search } },
            { promotionInfo: { referralCode: { contains: query.search.toUpperCase() } } },
          ],
        },
      ];
    } else {
      where.OR = promoterFilter;
    }

    // 状态筛选
    if (query.status === "active") where.isActive = true;
    else if (query.status === "inactive") where.isActive = false;

    const [promoters, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          contact: true,
          email: true,
          isActive: true,
          createdAt: true,
          promotionInfo: {
            select: {
              id: true,
              referralCode: true,
              commissionRate: true,
              clickCount: true,
              orderCount: true,
              totalSales: true,
              totalCommission: true,
              createdAt: true,
            },
          },
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return success({ list: promoters, total, page, pageSize });
  });

  // ─── 获取推广详情 ───
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id), OR: [{ role: "promoter" }, { promotionInfo: { isNot: null } }] },
      select: {
        id: true,
        contact: true,
        email: true,
        isActive: true,
        promotionInfo: true,
      },
    });
    if (!user) return reply.code(404).send(error("VALIDATION_ERROR", "推广人不存在"));
    return success(user);
  });

  // ─── 更新推广设置（只改推广信息，不改用户基本信息） ───
  app.patch("/:id/settings", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      commissionRate?: number;
    };

    const user = await prisma.user.findUnique({ where: { id: parseInt(id), OR: [{ role: "promoter" }, { promotionInfo: { isNot: null } }] } });
    if (!user) return reply.code(404).send(error("VALIDATION_ERROR", "推广人不存在"));

    const info = await prisma.promotionInfo.findUnique({ where: { userId: user.id } });
    if (!info) return reply.code(404).send(error("VALIDATION_ERROR", "推广信息不存在"));

    const data: Record<string, unknown> = {};
    if (body.commissionRate !== undefined) data.commissionRate = body.commissionRate;

    const updated = await prisma.promotionInfo.update({ where: { id: info.id }, data });
    return success(updated);
  });

  // ─── 审批通过（自动生成推广码 + 创建 PromotionInfo） ───
  app.post("/:id/approve", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { commissionRate?: number };

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id), OR: [{ role: "promoter" }, { promotionInfo: { isNot: null } }] },
      include: { promotionInfo: true },
    });
    if (!user) return reply.code(404).send(error("VALIDATION_ERROR", "用户不存在"));
    if (user.promotionInfo) return reply.code(400).send(error("VALIDATION_ERROR", "该用户已是推广人"));

    // 读取系统设置的默认佣金比例
    const defaultRateSetting = await prisma.systemSetting.findUnique({ where: { key: "promotion_default_commission_rate" } });
    const defaultRate = defaultRateSetting ? Number(defaultRateSetting.value) : 0.1;

    const code = generateReferralCode();
    const existingCode = await prisma.promotionInfo.findUnique({ where: { referralCode: code } });
    if (existingCode) return reply.code(500).send(error("INTERNAL_ERROR", "推广码生成冲突，请重试"));

    const info = await prisma.promotionInfo.create({
      data: {
        userId: user.id,
        referralCode: code,
        commissionRate: body.commissionRate ?? defaultRate,
      },
    });

    return success({
      id: user.id,
      email: user.email,
      referralCode: info.referralCode,
      commissionRate: info.commissionRate,
    });
  });

  // ─── 拒绝申请（角色改回 buyer） ───
  app.post("/:id/reject", async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id), OR: [{ role: "promoter" }, { promotionInfo: { isNot: null } }] },
      include: { promotionInfo: true },
    });
    if (!user) return reply.code(404).send(error("VALIDATION_ERROR", "用户不存在"));
    if (user.promotionInfo) return reply.code(400).send(error("VALIDATION_ERROR", "该用户已是推广人，无法拒绝"));

    await prisma.user.update({ where: { id: user.id }, data: { role: "buyer" } });
    return success(null);
  });

  // ─── 删除推广人 ───
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id: parseInt(id), OR: [{ role: "promoter" }, { promotionInfo: { isNot: null } }] } });
    if (!user) return reply.code(404).send(error("VALIDATION_ERROR", "推广人不存在"));

    // 删除推广信息
    await prisma.promotionInfo.deleteMany({ where: { userId: user.id } });
    // 删除用户
    await prisma.user.delete({ where: { id: user.id } });
    return success(null);
  });

  // ─── 禁用推广人 ───
  app.post("/:id/disable", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.user.findUnique({ where: { id: parseInt(id), OR: [{ role: "promoter" }, { promotionInfo: { isNot: null } }] } });
    if (!existing) return reply.code(404).send(error("VALIDATION_ERROR", "推广人不存在"));
    await prisma.user.update({ where: { id: parseInt(id) }, data: { isActive: false } });
    return success(null);
  });

  // ─── 启用推广人 ───
  app.post("/:id/enable", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.user.findUnique({ where: { id: parseInt(id), OR: [{ role: "promoter" }, { promotionInfo: { isNot: null } }] } });
    if (!existing) return reply.code(404).send(error("VALIDATION_ERROR", "推广人不存在"));
    await prisma.user.update({ where: { id: parseInt(id) }, data: { isActive: true } });
    return success(null);
  });

  // ─── 推广人的推广订单列表（管理员查看） ───
  app.get("/:id/orders", async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as { page?: string; pageSize?: string };
    const page = Math.max(1, parseInt(query.page || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || "20")));
    const skip = (page - 1) * pageSize;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id), OR: [{ role: "promoter" }, { promotionInfo: { isNot: null } }] },
      select: { promotionInfo: { select: { referralCode: true } } },
    });
    if (!user?.promotionInfo) return reply.code(404).send(error("VALIDATION_ERROR", "推广人不存在"));

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { referralCode: user.promotionInfo.referralCode },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          orderNo: true,
          totalAmount: true,
          commissionAmount: true,
          commissionStatus: true,
          paymentStatus: true,
          createdAt: true,
          productSnapshot: true,
        },
      }),
      prisma.order.count({ where: { referralCode: user.promotionInfo.referralCode } }),
    ]);

    return success({ list: orders, total, page, pageSize });
  });
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
