import { NextResponse } from "next/server";
import { createConcernInputSchema } from "@/modules/concerns/contracts";
import { createConcern } from "@/modules/concerns/server/concerns";
import {
  createPublicIdempotencyKey,
  withPublicIdempotency,
} from "@/server/idempotency";
import {
  enforcePublicRateLimit,
  getRateLimitIdentifierFromRequest,
} from "@/server/security/rate-limit";
import { verifyTurnstileToken } from "@/server/security/turnstile";
import {
  errorResult,
  ExpectedError,
  successResult,
} from "@/lib/action-result";

export async function POST(request: Request) {
  try {
    const rateLimitIdentifier = getRateLimitIdentifierFromRequest(request);
    await enforcePublicRateLimit({
      identifier: rateLimitIdentifier,
      limit: 5,
      scope: "concern.submit.ip",
      windowSeconds: 10 * 60,
    });

    const token = request.headers.get("x-captcha-response");
    const remoteIp =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for");

    const verified = await verifyTurnstileToken(token, remoteIp);
    if (!verified) {
      return NextResponse.json(
        errorResult(
          new ExpectedError("Security check failed. Please try again."),
          "Security check failed.",
        ),
        { status: 400 },
      );
    }

    const body: unknown = await request.json();
    const input = createConcernInputSchema.parse(body);
    const idempotencyKey = createPublicIdempotencyKey({
      fallbackParts: [
        rateLimitIdentifier,
        input.category,
        input.subject,
        input.message,
        input.attachmentStorageObjectId ?? "",
      ],
      request,
      scope: "concern.submit",
    });

    await withPublicIdempotency({
      duplicateMessage: "This concern has already been submitted.",
      key: idempotencyKey,
      run: () => createConcern({ input }),
      ttlSeconds: 10 * 60,
    });

    return NextResponse.json(successResult("Concern submitted."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Concern submission failed."), {
      status: 400,
    });
  }
}
