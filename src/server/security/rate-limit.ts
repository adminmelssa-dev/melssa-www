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

interface PublicRateLimitInput {
  identifier: string;
  limit: number;
  scope: string;
  windowSeconds: number;
}

export async function enforcePublicRateLimit({
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
