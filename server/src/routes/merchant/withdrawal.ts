import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success, error } from "../../lib/api-utils.js";

async function getEnabledAccountTypes(): Promise<string[]> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "promotion_withdrawal_account_types" },
  });
  return (setting?.value as string[]) ?? ["支付宝", "微信支付", "银行卡"];
}

export async function merchantWithdrawalRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // ─── 查询可提现余额 ───
  app.get("/balance", async (request, reply) => {
    const { userId } = (request as any).user;

    const info = await prisma.promotionInfo.findUnique({ where: { userId } });
    if (!info) return reply.code(400).send(error("VALIDATION_ERROR", "您还不是推广人"));

    return success({
      totalCommission: info.totalCommission,
      withdrawnAmount: info.withdrawnAmount,
      availableBalance: Number(info.totalCommission) - Number(info.withdrawnAmount),
      commissionRate: info.commissionRate,
    });
  });

  // ─── 申请提现 ───
  app.post("/apply", async (request, reply) => {
    const { userId } = (request as any).user;
    const body = request.body as {
      amount: number;
      accountType: string;
      accountName?: string;
      accountNumber: string;
    };

    // 参数校验
    if (!body.amount || body.amount <= 0) {
      return reply.code(400).send(error("VALIDATION_ERROR", "请输入有效的提现金额"));
    }
    if (body.amount < 10) {
      return reply.code(400).send(error("VALIDATION_ERROR", "最低提现金额为 ¥10"));
    }
    const enabledTypes = await getEnabledAccountTypes();
    if (!body.accountType || !enabledTypes.includes(body.accountType)) {
      return reply.code(400).send(error("VALIDATION_ERROR", "请选择有效的收款账户类型"));
    }
    if (!body.accountNumber) {
      return reply.code(400).send(error("VALIDATION_ERROR", "请输入收款账号"));
    }

    // 查询推广信息
    const info = await prisma.promotionInfo.findUnique({ where: { userId } });
    if (!info) return reply.code(400).send(error("VALIDATION_ERROR", "您还不是推广人"));

    // 检查可用余额
    const available = Number(info.totalCommission) - Number(info.withdrawnAmount);
    if (body.amount > available) {
      return reply.code(400).send(error("VALIDATION_ERROR", "提现金额超出可提现余额"));
    }

    // 检查是否有待审核的申请
    const pendingExists = await prisma.withdrawalRequest.findFirst({
      where: { userId, status: "pending" },
    });
    if (pendingExists) {
      return reply.code(400).send(error("VALIDATION_ERROR", "您有待审核的提现申请，请等待审核完成后再提交"));
    }

    // 创建提现申请
    const req = await prisma.withdrawalRequest.create({
      data: {
        userId,
        amount: body.amount,
        fee: 0,
        netAmount: body.amount,
        status: "pending",
        accountType: body.accountType,
        accountName: body.accountName || null,
        accountNumber: body.accountNumber,
      },
    });

    return success({
      id: req.id,
      amount: req.amount,
      status: req.status,
      createdAt: req.createdAt,
    });
  });

  // ─── 提现记录 ───
  app.get("/history", async (request, reply) => {
    const { userId } = (request as any).user;

    const list = await prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amount: true,
        fee: true,
        netAmount: true,
        status: true,
        accountType: true,
        accountName: true,
        accountNumber: true,
        remark: true,
        createdAt: true,
        reviewedAt: true,
        paidAt: true,
      },
    });

    return success(list);
  });
}
