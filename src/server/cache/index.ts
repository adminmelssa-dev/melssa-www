import "server-only";

import type { z } from "zod";
import { env } from "@/lib/env";
import { getRedisClient } from "@/server/redis";

export const PUBLIC_CACHE_TTL_SECONDS = 10 * 60;

export const PUBLIC_CACHE_KEYS = {
  announcements: "public:announcements:v1",
  events: "public:events:v1",
  finance: "public:finance:v1",
  fundraising: "public:fundraising:v1",
  gallery: "public:gallery:v1",
  lecturers: "public:lecturers:v1",
  resources: "public:resources:v1",
  scholarships: "public:scholarships:v1",
  spotlights: "public:spotlights:v1",
} satisfies Record<string, string>;

interface ReadThroughCacheInput<TValue> {
  key: string;
  load: () => Promise<TValue>;
  schema: z.ZodType<TValue>;
  ttlSeconds: number;
}

const memoryCache = new Map<
  string,
  {
    expiresAt: number;
    value: unknown;
  }
>();

export async function getCachedJson<TValue>({
  key,
  load,
  schema,
  ttlSeconds,
}: ReadThroughCacheInput<TValue>): Promise<TValue> {
  if (env.CACHE_DRIVER === "noop") return load();

  const memoryValue = getMemoryCacheValue({ key, schema });
  if (memoryValue !== null) return memoryValue;

  const redis = getRedisClient();
  if (!redis) return load();

  try {
    const cachedValue = await redis.get<string>(createCacheKey(key));
    if (cachedValue) {
      const parsedValue = schema.parse(parseJson(cachedValue));
      setMemoryCacheValue({ key, ttlSeconds, value: parsedValue });
      return parsedValue;
    }
  } catch (error) {
    console.error("Redis cache read failed.", { error, key });
  }

  const loadedValue = await load();
  setMemoryCacheValue({ key, ttlSeconds, value: loadedValue });

  try {
    await redis.set(createCacheKey(key), JSON.stringify(loadedValue), {
      ex: ttlSeconds,
    });
  } catch (error) {
    console.error("Redis cache write failed.", { error, key });
  }

  return loadedValue;
}

export async function invalidateCacheKeys(keys: readonly string[]): Promise<void> {
  if (keys.length === 0) return;

  for (const key of keys) {
    memoryCache.delete(key);
  }

  const redis = getRedisClient();
  if (!redis || env.CACHE_DRIVER !== "redis") return;

  try {
    await redis.del(...keys.map((key) => createCacheKey(key)));
  } catch (error) {
    console.error("Redis cache invalidation failed.", { error, keys });
  }
}

function getMemoryCacheValue<TValue>({
  key,
  schema,
}: {
  key: string;
  schema: z.ZodType<TValue>;
}): TValue | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  const parsedValue = schema.safeParse(entry.value);
  if (!parsedValue.success) {
    memoryCache.delete(key);
    return null;
  }

  return parsedValue.data;
}

function setMemoryCacheValue({
  key,
  ttlSeconds,
  value,
}: {
  key: string;
  ttlSeconds: number;
  value: unknown;
}): void {
  memoryCache.set(key, {
    expiresAt: Date.now() + ttlSeconds * 1_000,
    value,
  });
}

function createCacheKey(key: string): string {
  return `melssa:cache:${key}`;
}

function parseJson(value: string): unknown {
  return JSON.parse(value);
}
