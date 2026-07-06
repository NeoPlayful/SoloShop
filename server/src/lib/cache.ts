import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const KEY_PREFIX = process.env.REDIS_KEY_PREFIX || "soloshop";

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
});

function key(...parts: string[]): string {
  return [KEY_PREFIX, ...parts].join(":");
}

export { redis, key };
