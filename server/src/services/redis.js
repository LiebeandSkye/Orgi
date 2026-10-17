import "dotenv/config";
import { Redis } from "@upstash/redis";

/**
 * Redis-compatible in-memory fallback store with TTL expiration (seconds).
 * Ensures `getOrSetCache` still caches all Books/Manga feeds on the server
 * even when UPSTASH_REDIS_REST_URL is not configured in local `.env`.
 */
class InMemoryRedisAdapter {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, opts = {}) {
    const ttlSeconds = typeof opts?.ex === "number" ? opts.ex : 3600;
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return "OK";
  }

  async del(key) {
    this.store.delete(key);
    return 1;
  }
}

export const isUpstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

export const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : new InMemoryRedisAdapter();
