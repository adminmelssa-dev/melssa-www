import { NextResponse } from "next/server";
import { createConcernInputSchema } from "@/modules/concerns/contracts";
import { createConcern } from "@/modules/concerns/server/concerns";
import { verifyTurnstileToken } from "@/server/security/turnstile";
import { errorResult, successResult } from "@/lib/action-result";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("x-captcha-response");
    const remoteIp =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for");

    const verified = await verifyTurnstileToken(token, remoteIp);
    if (!verified) {
      return NextResponse.json(
        errorResult(
          new Error("Security check failed. Please try again."),
          "Security check failed.",
        ),
        { status: 400 },
      );
    }

    const body: unknown = await request.json();
    const input = createConcernInputSchema.parse(body);

    await createConcern({ input });

    return NextResponse.json(successResult("Concern submitted."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Concern submission failed."), {
      status: 400,
    });
  }
}
