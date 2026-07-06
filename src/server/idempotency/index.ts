import "server-only";

import { createHash } from "crypto";
import { ExpectedError } from "@/lib/action-result";
import { env } from "@/lib/env";
import { getRedisClient } from "@/server/redis";

interface PublicIdempotencyKeyInput {
  fallbackParts: readonly string[];
  request: Request;
  scope: string;
}

interface WithPublicIdempotencyInput<TResult> {
  duplicateMessage: string;
  key: string;
  run: () => Promise<TResult>;
  ttlSeconds: number;
}

export function createPublicIdempotencyKey({
  fallbackParts,
  request,
  scope,
}: PublicIdempotencyKeyInput): string {
  const providedKey = getProvidedIdempotencyKey(request);
  const hash = createHash("sha256")
    .update(env.BETTER_AUTH_SECRET)
    .update(":")
    .update(scope)
    .update(":");

  if (providedKey) {
    hash.update("provided:");
    hash.update(providedKey);
  } else {
    hash.update("fallback:");
    for (const part of fallbackParts) {
      hash.update(part);
      hash.update(":");
    }
  }

  return `melssa:idempotency:${scope}:${hash.digest("hex")}`;
}

export async function withPublicIdempotency<TResult>({
  duplicateMessage,
  key,
  run,
  ttlSeconds,
}: WithPublicIdempotencyInput<TResult>): Promise<TResult> {
  if (env.IDEMPOTENCY_DRIVER !== "redis") return run();

  const redis = getRedisClient();
  if (!redis) return run();

  try {
    const reserved = await redis.set(key, "reserved", {
      ex: ttlSeconds,
      nx: true,
    });

    if (reserved !== "OK") {
      throw new ExpectedError(duplicateMessage);
    }
  } catch (error) {
    if (error instanceof ExpectedError) throw error;
    console.error("Redis idempotency reservation failed.", { error });
    return run();
  }

  try {
    return await run();
  } catch (error) {
    await releaseFailedIdempotencyKey(key);
    throw error;
  }
}

async function releaseFailedIdempotencyKey(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error("Redis idempotency release failed.", { error });
  }
}

function getProvidedIdempotencyKey(request: Request): string | null {
  const value = request.headers.get("idempotency-key")?.trim();
  if (!value) return null;

  return /^[a-zA-Z0-9:._-]{8,200}$/.test(value) ? value : null;
}
