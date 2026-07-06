import "server-only";

import { randomUUID } from "crypto";
import { env } from "@/lib/env";
import { getRedisClient } from "@/server/redis";

export type LockHandle =
  | {
      driver: "noop";
      key: string;
    }
  | {
      driver: "redis";
      key: string;
      token: string;
    };

interface AcquireLockInput {
  key: string;
  ttlSeconds: number;
}

const RELEASE_LOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end

return 0
`;

export async function acquireLock({
  key,
  ttlSeconds,
}: AcquireLockInput): Promise<LockHandle | null> {
  if (env.LOCK_DRIVER !== "redis") {
    return { driver: "noop", key };
  }

  const redis = getRedisClient();
  if (!redis) {
    return { driver: "noop", key };
  }

  const lockKey = createLockKey(key);
  const token = randomUUID();
  const result = await redis.set(lockKey, token, {
    ex: ttlSeconds,
    nx: true,
  });

  if (result !== "OK") return null;

  return {
    driver: "redis",
    key: lockKey,
    token,
  };
}

export async function releaseLock(lock: LockHandle): Promise<void> {
  if (lock.driver !== "redis") return;

  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.eval<[string], number>(RELEASE_LOCK_SCRIPT, [lock.key], [
      lock.token,
    ]);
  } catch (error) {
    console.error("Redis lock release failed.", { error, key: lock.key });
  }
}

function createLockKey(key: string): string {
  return `melssa:lock:${key}`;
}
