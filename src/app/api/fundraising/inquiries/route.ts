import { NextResponse } from "next/server";
import { createFundraisingInquiryInputSchema } from "@/modules/fundraising/contracts";
import { createFundraisingInquiry } from "@/modules/fundraising/server/fundraising";
import {
  errorResult,
  ExpectedError,
  successResult,
} from "@/lib/action-result";
import {
  createPublicIdempotencyKey,
  withPublicIdempotency,
} from "@/server/idempotency";
import {
  enforcePublicRateLimit,
  getRateLimitIdentifierFromRequest,
} from "@/server/security/rate-limit";
import { verifyTurnstileToken } from "@/server/security/turnstile";

export async function POST(request: Request) {
  try {
    const rateLimitIdentifier = getRateLimitIdentifierFromRequest(request);
    await enforcePublicRateLimit({
      identifier: rateLimitIdentifier,
      limit: 5,
      scope: "fundraising.inquiry.ip",
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
    const input = createFundraisingInquiryInputSchema.parse(body);

    await enforcePublicRateLimit({
      identifier: `email:${input.contactEmail}`,
      limit: 3,
      scope: "fundraising.inquiry.email",
      windowSeconds: 60 * 60,
    });

    const idempotencyKey = createPublicIdempotencyKey({
      fallbackParts: [
        rateLimitIdentifier,
        input.contactEmail,
        String(input.campaignId ?? ""),
        input.message,
      ],
      request,
      scope: "fundraising.inquiry",
    });

    await withPublicIdempotency({
      duplicateMessage: "This inquiry has already been submitted.",
      key: idempotencyKey,
      run: () => createFundraisingInquiry(input),
      ttlSeconds: 10 * 60,
    });

    return NextResponse.json(successResult("Inquiry submitted."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Inquiry submission failed."), {
      status: 400,
    });
  }
}
