import "server-only";

import { createHash } from "crypto";
import {
  and,
  eq,
  lt,
  sql,
} from "drizzle-orm";
import { ExpectedError } from "@/lib/action-result";
import { env } from "@/lib/env";
import { db } from "@/server/db";
import { publicRateLimits } from "@/server/db/schema";
import { getRedisClient } from "@/server/redis";

interface PublicRateLimitInput {
  identifier: string;
  limit: number;
  scope: string;
  windowSeconds: number;
}

const REDIS_RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])

if current == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end

return current
`;

export async function enforcePublicRateLimit(
  input: PublicRateLimitInput,
): Promise<void> {
  if (env.RATE_LIMIT_DRIVER === "redis") {
    try {
      await enforceRedisPublicRateLimit(input);
      return;
    } catch (error) {
      if (error instanceof ExpectedError) throw error;

      console.error("Redis public rate limit failed. Falling back to database.", {
        error,
        scope: input.scope,
      });
    }
  }

  await enforceDatabasePublicRateLimit(input);
}

async function enforceRedisPublicRateLimit({
  identifier,
  limit,
  scope,
  windowSeconds,
}: PublicRateLimitInput): Promise<void> {
  const redis = getRedisClient();

  if (!redis) {
    await enforceDatabasePublicRateLimit({
      identifier,
      limit,
      scope,
      windowSeconds,
    });
    return;
  }

  const count = await redis.eval<[string], number>(
    REDIS_RATE_LIMIT_SCRIPT,
    [createRedisRateLimitKey(scope, identifier)],
    [String(windowSeconds)],
  );

  if (count > limit) {
    throw new ExpectedError(
      "Too many attempts. Wait a few minutes before trying again.",
    );
  }
}

async function enforceDatabasePublicRateLimit({
  identifier,
  limit,
  scope,
  windowSeconds,
}: PublicRateLimitInput): Promise<void> {
  const now = new Date();
  const key = createRateLimitKey(scope, identifier);
  const [existingLimit] = await db
    .select({
      count: publicRateLimits.count,
      resetAt: publicRateLimits.resetAt,
    })
    .from(publicRateLimits)
    .where(eq(publicRateLimits.key, key))
    .limit(1);

  if (!existingLimit || existingLimit.resetAt <= now) {
    await resetRateLimitWindow({
      key,
      now,
      scope,
      windowSeconds,
    });
    await cleanupExpiredRateLimits(now);
    return;
  }

  if (existingLimit.count >= limit) {
    throw new ExpectedError(
      "Too many attempts. Wait a few minutes before trying again.",
    );
  }

  const [updatedLimit] = await db
    .update(publicRateLimits)
    .set({
      count: sql`${publicRateLimits.count} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(publicRateLimits.key, key),
        lt(publicRateLimits.count, limit),
      ),
    )
    .returning({ count: publicRateLimits.count });

  if (!updatedLimit) {
    throw new ExpectedError(
      "Too many attempts. Wait a few minutes before trying again.",
    );
  }
}

export function getRateLimitIdentifierFromRequest(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  if (firstForwardedIp) return `ip:${firstForwardedIp}`;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return `ip:${realIp}`;

  return `ua:${request.headers.get("user-agent") ?? "unknown"}`;
}

async function resetRateLimitWindow({
  key,
  now,
  scope,
  windowSeconds,
}: {
  key: string;
  now: Date;
  scope: string;
  windowSeconds: number;
}): Promise<void> {
  const resetAt = new Date(now.getTime() + windowSeconds * 1_000);

  await db
    .insert(publicRateLimits)
    .values({
      key,
      scope,
      count: 1,
      resetAt,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: publicRateLimits.key,
      set: {
        count: 1,
        resetAt,
        scope,
        updatedAt: now,
      },
    });
}

async function cleanupExpiredRateLimits(now: Date): Promise<void> {
  await db.delete(publicRateLimits).where(lt(publicRateLimits.resetAt, now));
}

function createRateLimitKey(scope: string, identifier: string): string {
  return createHash("sha256")
    .update(env.BETTER_AUTH_SECRET)
    .update(":")
    .update(scope)
    .update(":")
    .update(identifier)
    .digest("hex");
}

function createRedisRateLimitKey(scope: string, identifier: string): string {
  return `melssa:rate-limit:${createRateLimitKey(scope, identifier)}`;
}
