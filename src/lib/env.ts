import { z } from "zod";

const booleanFromEnv = z
  .string()
  .optional()
  .transform((value) => value !== "false");

const trueWhenExplicit = z
  .string()
  .optional()
  .transform((value) => value === "true");

const optionalEnvString = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : undefined;
  });

const optionalEnvEmail = optionalEnvString.pipe(z.email().optional());
const optionalEnvUrl = optionalEnvString.pipe(z.url().optional());

const optionalCsv = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return [];

    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  });

const envSchema = z
  .object({
    NODE_ENV: z
      .union([z.literal("development"), z.literal("production"), z.literal("test")])
      .default("development"),
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    NEXT_PUBLIC_APP_URL: z.url(),
    AUTH_ALLOWED_EMAIL_DOMAINS: optionalCsv,
    AUTH_ALLOWED_EMAILS: optionalCsv,
    AUTH_REQUIRE_EMAIL_VERIFICATION: booleanFromEnv,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalEnvString,
    TURNSTILE_SECRET_KEY: optionalEnvString,
    TURNSTILE_ALLOWED_HOSTNAMES: optionalCsv,
    INITIAL_SITE_ADMIN_EMAIL: optionalEnvEmail,
    INITIAL_SITE_ADMIN_PASSWORD: optionalEnvString.pipe(
      z.string().min(8).optional(),
    ),
    INITIAL_SITE_ADMIN_NAME: optionalEnvString,
    INITIAL_SITE_ADMIN_RESET_PASSWORD: trueWhenExplicit,
    MAIL_DRIVER: z.union([z.literal("log"), z.literal("resend")]).default("log"),
    RESEND_API_KEY: optionalEnvString,
    RESEND_FROM: optionalEnvString,
    CACHE_DRIVER: z.union([z.literal("noop"), z.literal("redis")]).optional(),
    IDEMPOTENCY_DRIVER: z
      .union([z.literal("noop"), z.literal("redis")])
      .optional(),
    RATE_LIMIT_DRIVER: z.union([z.literal("database"), z.literal("redis")]).optional(),
    LOCK_DRIVER: z.union([z.literal("noop"), z.literal("redis")]).optional(),
    SCHOLARSHIPS_ENABLED: booleanFromEnv,
    UPSTASH_REDIS_REST_URL: optionalEnvUrl,
    UPSTASH_REDIS_REST_TOKEN: optionalEnvString,
    UPLOAD_DRIVER: z.literal("uploadthing").default("uploadthing"),
    UPLOADTHING_TOKEN: optionalEnvString,
    UPLOAD_PUBLIC_HOSTNAMES: optionalCsv,
  })
  .superRefine((value, ctx) => {
    if (value.MAIL_DRIVER === "resend") {
      if (!value.RESEND_API_KEY) {
        ctx.addIssue({
          code: "custom",
          path: ["RESEND_API_KEY"],
          message: "RESEND_API_KEY is required when MAIL_DRIVER=resend.",
        });
      }

      if (!value.RESEND_FROM) {
        ctx.addIssue({
          code: "custom",
          path: ["RESEND_FROM"],
          message: "RESEND_FROM is required when MAIL_DRIVER=resend.",
        });
      }
    }

    if (
      Boolean(value.UPSTASH_REDIS_REST_URL) !==
      Boolean(value.UPSTASH_REDIS_REST_TOKEN)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["UPSTASH_REDIS_REST_URL"],
        message:
          "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set together.",
      });
    }

    if (
      (value.CACHE_DRIVER === "redis" ||
        value.IDEMPOTENCY_DRIVER === "redis" ||
        value.RATE_LIMIT_DRIVER === "redis" ||
        value.LOCK_DRIVER === "redis") &&
      (!value.UPSTASH_REDIS_REST_URL || !value.UPSTASH_REDIS_REST_TOKEN)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["UPSTASH_REDIS_REST_URL"],
        message:
          "Upstash Redis env vars are required when a Redis-backed driver is enabled.",
      });
    }

    if (
      value.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
      value.TURNSTILE_SECRET_KEY === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["TURNSTILE_SECRET_KEY"],
        message:
          "TURNSTILE_SECRET_KEY is required when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.",
      });
    }

    if (
      value.TURNSTILE_SECRET_KEY &&
      value.NEXT_PUBLIC_TURNSTILE_SITE_KEY === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_TURNSTILE_SITE_KEY"],
        message:
          "NEXT_PUBLIC_TURNSTILE_SITE_KEY is required when TURNSTILE_SECRET_KEY is set.",
      });
    }
  })
  .transform((value) => {
    const hasRedis =
      value.UPSTASH_REDIS_REST_URL !== undefined &&
      value.UPSTASH_REDIS_REST_TOKEN !== undefined;

    return {
      ...value,
      CACHE_DRIVER: value.CACHE_DRIVER ?? (hasRedis ? "redis" : "noop"),
      IDEMPOTENCY_DRIVER:
        value.IDEMPOTENCY_DRIVER ?? (hasRedis ? "redis" : "noop"),
      RATE_LIMIT_DRIVER:
        value.RATE_LIMIT_DRIVER ?? (hasRedis ? "redis" : "database"),
      LOCK_DRIVER: value.LOCK_DRIVER ?? (hasRedis ? "redis" : "noop"),
    };
  });

export const env = envSchema.parse(process.env);
