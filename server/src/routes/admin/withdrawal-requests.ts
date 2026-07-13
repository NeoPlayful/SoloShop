import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success, error } from "../../lib/api-utils.js";

export async function adminWithdrawalRequestRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // ─── 提现统计 ───
  app.get("/stats", async (request) => {
    const user = (request as any).user;
    if (user.role !== "admin" && user.role !== "super_admin") {
      return error("FORBIDDEN", "无权限");
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      pendingAgg,
      monthlyPaidAgg,
      totalPaidAgg,
      monthlyApplyAgg,
    ] = await Promise.all([
      prisma.withdrawalRequest.aggregate({
        where: { status: "pending" },
        _count: true,
        _sum: { amount: true },
      }),
      prisma.withdrawalRequest.aggregate({
        where: { status: "paid", paidAt: { gte: firstDayOfMonth } },
        _sum: { netAmount: true },
      }),
      prisma.withdrawalRequest.aggregate({
        where: { status: "paid" },
        _sum: { netAmount: true },
      }),
      prisma.withdrawalRequest.count({
        where: { createdAt: { gte: firstDayOfMonth } },
      }),
    ]);

    return success({
      pendingCount: pendingAgg._count,
      pendingAmount: pendingAgg._sum.amount ?? 0,
      monthlyPaid: monthlyPaidAgg._sum.netAmount ?? 0,
      totalWithdrawn: totalPaidAgg._sum.netAmount ?? 0,
      monthlyApplyCount: monthlyApplyAgg,
    });
  });

  // ─── 提现申请列表 ───
  app.get("/", async (request) => {
    const user = (request as any).user;
    if (user.role !== "admin" && user.role !== "super_admin") {
      return error("FORBIDDEN", "无权限");
    }

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

    if (query.status && query.status !== "all") {
      where.status = query.status;
    }

    if (query.search) {
      where.user = {
        OR: [
          { email: { contains: query.search } },
          { username: { contains: query.search } },
        ],
      };
    }

    const [list, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        select: {
          id: true,
          userId: true,
          amount: true,
          fee: true,
          netAmount: true,
          status: true,
          accountType: true,
          accountName: true,
          accountNumber: true,
          remark: true,
          reviewedBy: true,
          reviewedAt: true,
          paidAt: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              username: true,
              promotionInfo: {
                select: {
                  referralCode: true,
                  totalCommission: true,
                  withdrawnAmount: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);

    return success({ list, total, page, pageSize });
  });

  // ─── 审核通过 ───
  app.post("/:id/approve", async (request, reply) => {
    const admin = (request as any).user;
    if (admin.role !== "admin" && admin.role !== "super_admin") {
      return reply.code(403).send(error("FORBIDDEN", "无权限"));
    }

    const { id } = request.params as { id: string };
    const req = await prisma.withdrawalRequest.findUnique({ where: { id: parseInt(id) } });
    if (!req) return reply.code(404).send(error("VALIDATION_ERROR", "提现申请不存在"));
    if (req.status !== "pending") return reply.code(400).send(error("VALIDATION_ERROR", "仅待审核的申请可以审核通过"));

    const [updated] = await prisma.$transaction([
      prisma.withdrawalRequest.update({
        where: { id: req.id },
        data: {
          status: "approved",
          reviewedBy: admin.userId,
          reviewedAt: new Date(),
        },
      }),
      prisma.promotionInfo.update({
        where: { userId: req.userId },
        data: { withdrawnAmount: { increment: req.netAmount } },
      }),
    ]);

    return success(updated);
  });

  // ─── 拒绝 ───
  app.post("/:id/reject", async (request, reply) => {
    const admin = (request as any).user;
    if (admin.role !== "admin" && admin.role !== "super_admin") {
      return reply.code(403).send(error("FORBIDDEN", "无权限"));
    }

    const { id } = request.params as { id: string };
    const body = request.body as { remark?: string };

    const req = await prisma.withdrawalRequest.findUnique({ where: { id: parseInt(id) } });
    if (!req) return reply.code(404).send(error("VALIDATION_ERROR", "提现申请不存在"));
    if (req.status !== "pending") return reply.code(400).send(error("VALIDATION_ERROR", "仅待审核的申请可以拒绝"));

    const updated = await prisma.withdrawalRequest.update({
      where: { id: req.id },
      data: {
        status: "rejected",
        remark: body.remark || null,
        reviewedBy: admin.userId,
        reviewedAt: new Date(),
      },
    });

    return success(updated);
  });

  // ─── 标记已打款 ───
  app.post("/:id/mark-paid", async (request, reply) => {
    const admin = (request as any).user;
    if (admin.role !== "admin" && admin.role !== "super_admin") {
      return reply.code(403).send(error("FORBIDDEN", "无权限"));
    }

    const { id } = request.params as { id: string };
    const req = await prisma.withdrawalRequest.findUnique({ where: { id: parseInt(id) } });
    if (!req) return reply.code(404).send(error("VALIDATION_ERROR", "提现申请不存在"));
    if (req.status !== "approved") return reply.code(400).send(error("VALIDATION_ERROR", "仅已通过的申请可以标记打款"));

    const updated = await prisma.withdrawalRequest.update({
      where: { id: req.id },
      data: {
        status: "paid",
        paidAt: new Date(),
      },
    });

    return success(updated);
  });
}
