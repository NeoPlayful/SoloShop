/**
 * 基于 Redis 的限流工具
 *
 * 使用滑动窗口算法（Redis Sorted Set）实现更精确的限流。
 * 每个限流维度一个 Key，TTL 自动过期清理。
 */
import { redis, key } from "./cache.js";

interface RateLimitConfig {
  windowMs: number;   // 时间窗口（毫秒）
  maxRequests: number; // 窗口内最大请求数
}

const defaults: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 分钟
  maxRequests: 30,
};

// ─── 限流检查 ───
async function checkRateLimit(
  identifier: string,         // 限流维度，如 ip:{address}、order:create:{ip}
  config: Partial<RateLimitConfig> = {},
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const { windowMs, maxRequests } = { ...defaults, ...config };
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = key("ratelimit", identifier);

  const pipeline = redis.pipeline();

  // 移除窗口外的过期记录
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  // 添加当前请求
  pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
  // 统计窗口内请求数
  pipeline.zcard(redisKey);
  // 设置 TTL
  pipeline.expire(redisKey, Math.ceil(windowMs / 1000));

  const results = await pipeline.exec();
  const count = (results?.[2]?.[1] as number) || 0;

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
    resetTime: now + windowMs,
  };
}

export { checkRateLimit };
export type { RateLimitConfig };
