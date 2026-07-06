/**
 * 卡密 Redis 池
 *
 * 核心原理：
 * - 使用 Redis Set 存储可用卡密的 ID，SPOP 原子弹出实现防超卖
 * - 数据库负责持久化，Redis 负责高速原子计数
 * - 重启时从 DB 重新加载所有 available 状态的卡密 ID
 */
import { redis, key } from "./cache.js";
import { prisma } from "./db.js";
import type { PrismaClient } from "@prisma/client";

// ─── 初始化卡密池（启动时调用） ───
async function rebuildPool(productId?: number): Promise<void> {
  const where = productId
    ? { productId, status: "available" as const }
    : { status: "available" as const };

  const cards = await prisma.card.findMany({
    where,
    select: { id: true, productId: true },
  });

  // 按 productId 分组填充 Redis Set
  const grouped = new Map<number, number[]>();
  for (const card of cards) {
    const list = grouped.get(card.productId) || [];
    list.push(card.id);
    grouped.set(card.productId, list);
  }

  const pipeline = redis.pipeline();
  for (const [pid, ids] of grouped) {
    if (ids.length > 0) {
      pipeline.sadd(key("card", "pool", String(pid)), ...ids);
    }
  }
  await pipeline.exec();
}

// ─── 获取可用库存数量 ───
async function getAvailableStock(productId: number): Promise<number> {
  return redis.scard(key("card", "pool", String(productId)));
}

// ─── 原子锁定 N 条卡密 ───
async function lockCards(productId: number, quantity: number): Promise<number[]> {
  if (quantity <= 0) return [];

  // 原子弹出 N 个卡密 ID
  const ids = await redis.spop(key("card", "pool", String(productId)), quantity);

  if (!ids || ids.length === 0) {
    return [];
  }

  const cardIds = ids.map((id) => Number(id));

  // DB 标记为 locked
  const now = new Date();
  try {
    const result = await prisma.card.updateMany({
      where: { id: { in: cardIds }, status: "available" },
      data: { status: "locked", lockedAt: now },
    });

    // 如果 DB 更新行数不足，说明状态已被其他操作改变
    if (result.count < cardIds.length) {
      // 回滚：把未成功更新的 ID 放回 Redis
      const lockedIds = cardIds.slice(0, result.count);
      const failedIds = cardIds.slice(result.count);
      if (failedIds.length > 0) {
        await redis.sadd(key("card", "pool", String(productId)), ...failedIds);
      }
      return lockedIds;
    }

    return cardIds;
  } catch (err) {
    // DB 错误，回滚 Redis
    await redis.sadd(key("card", "pool", String(productId)), ...cardIds);
    throw err;
  }
}

// ─── 释放锁定（超时释放或手动关闭订单） ───
async function releaseCards(cardIds: number[], productId: number): Promise<void> {
  const pipeline = redis.pipeline();

  // DB 更新
  await prisma.card.updateMany({
    where: { id: { in: cardIds }, status: "locked" },
    data: { status: "available", orderId: null, lockedAt: null },
  });

  // Redis 加回
  pipeline.sadd(key("card", "pool", String(productId)), ...cardIds);
  await pipeline.exec();
}

// ─── 支付成功，从池中移除（已锁定状态 → sold） ───
async function confirmSale(cardIds: number[]): Promise<void> {
  // 卡密在 lock 时已从 Redis 池移除，此处只需更新 DB
  await prisma.card.updateMany({
    where: { id: { in: cardIds }, status: "locked" },
    data: { status: "sold", soldAt: new Date() },
  });
}

export { rebuildPool, getAvailableStock, lockCards, releaseCards, confirmSale };
