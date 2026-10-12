import { redis as defaultRedis } from "./redis.js";

/**
 * Retrieves an item from Upstash Redis or fetches, stores, and returns it.
 * Gracefully falls back to fetchFn if Redis is unconfigured or encounters an error.
 *
 * @param {string} key - Cache key identifier
 * @param {number} ttlSeconds - Expiration time in seconds
 * @param {Function} fetchFn - Async function returning fresh data
 * @param {any} [client] - Optional custom Redis client (used for testing/overrides)
 * @returns {Promise<any>}
 */
export async function getOrSetCache(key, ttlSeconds, fetchFn, client = undefined) {
  const activeClient = client !== undefined ? client : defaultRedis;

  if (!activeClient) {
    return await fetchFn();
  }

  const start = performance.now();
  try {
    const cached = await activeClient.get(key);
    if (cached !== null && cached !== undefined) {
      const elapsed = (performance.now() - start).toFixed(1);
      console.log(`⚡ [Redis Cache HIT] ${key} (${elapsed}ms)`);
      if (typeof cached === "string") {
        try {
          return JSON.parse(cached);
        } catch {
          return cached;
        }
      }
      return cached;
    }
  } catch (err) {
    console.warn(`[Cache] Error reading key "${key}":`, err.message);
    return await fetchFn();
  }

  console.log(`🌐 [Redis Cache MISS] ${key} -> fetching from upstream...`);
  const freshData = await fetchFn();

  try {
    await activeClient.set(key, freshData, { ex: ttlSeconds });
    console.log(`💾 [Redis Cached] ${key} (TTL: ${ttlSeconds}s)`);
  } catch (err) {
    console.warn(`[Cache] Error setting key "${key}":`, err.message);
  }

  return freshData;
}
