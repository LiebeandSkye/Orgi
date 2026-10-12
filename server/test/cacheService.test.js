import test from "node:test";
import assert from "node:assert/strict";
import { getOrSetCache } from "../src/services/cacheService.js";

test("getOrSetCache returns fetched data when redis client is null", async () => {
  let fetchCount = 0;
  const fetchFn = async () => {
    fetchCount++;
    return { data: "live" };
  };

  const result = await getOrSetCache("test:null_redis", 60, fetchFn, null);
  assert.deepEqual(result, { data: "live" });
  assert.equal(fetchCount, 1);
});

test("getOrSetCache returns cached data on cache hit without calling fetchFn", async () => {
  let fetchCount = 0;
  const fetchFn = async () => {
    fetchCount++;
    return { data: "live" };
  };

  const mockRedis = {
    get: async (key) => ({ data: "cached" }),
    set: async () => {},
  };

  const result = await getOrSetCache("test:hit", 60, fetchFn, mockRedis);
  assert.deepEqual(result, { data: "cached" });
  assert.equal(fetchCount, 0);
});

test("getOrSetCache calls fetchFn and sets cache on cache miss", async () => {
  let fetchCount = 0;
  let savedKey = null;
  let savedValue = null;
  let savedOpts = null;

  const fetchFn = async () => {
    fetchCount++;
    return { data: "live_miss" };
  };

  const mockRedis = {
    get: async () => null,
    set: async (key, value, opts) => {
      savedKey = key;
      savedValue = value;
      savedOpts = opts;
    },
  };

  const result = await getOrSetCache("test:miss", 120, fetchFn, mockRedis);
  assert.deepEqual(result, { data: "live_miss" });
  assert.equal(fetchCount, 1);
  assert.equal(savedKey, "test:miss");
  assert.deepEqual(savedValue, { data: "live_miss" });
  assert.deepEqual(savedOpts, { ex: 120 });
});

test("getOrSetCache falls back to fetchFn when redis throws an error", async () => {
  let fetchCount = 0;
  const fetchFn = async () => {
    fetchCount++;
    return { fallback: true };
  };

  const mockRedis = {
    get: async () => {
      throw new Error("Redis connection error");
    },
    set: async () => {},
  };

  const result = await getOrSetCache("test:error", 60, fetchFn, mockRedis);
  assert.deepEqual(result, { fallback: true });
  assert.equal(fetchCount, 1);
});
