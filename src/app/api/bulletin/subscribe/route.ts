import { NextResponse } from "next/server";
import { subscribeToBulletinInputSchema } from "@/modules/bulletin/contracts";
import {
  subscribeToBulletin,
  type BulletinSubscriptionResult,
} from "@/modules/bulletin/server/subscriptions";
import { errorResult, successResult } from "@/lib/action-result";
import {
  enforcePublicRateLimit,
  getRateLimitIdentifierFromRequest,
} from "@/server/security/rate-limit";

export async function POST(request: Request) {
  try {
    await enforcePublicRateLimit({
      identifier: getRateLimitIdentifierFromRequest(request),
      limit: 8,
      scope: "bulletin.subscribe.ip",
      windowSeconds: 10 * 60,
    });

    const body: unknown = await request.json();
    const input = subscribeToBulletinInputSchema.parse(body);

    await enforcePublicRateLimit({
      identifier: `email:${input.email}`,
      limit: 3,
      scope: "bulletin.subscribe.email",
      windowSeconds: 60 * 60,
    });

    const result = await subscribeToBulletin(input);

    return NextResponse.json(successResult(getSubscriptionMessage(result)));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Subscription failed."), {
      status: 400,
    });
  }
}

function getSubscriptionMessage(result: BulletinSubscriptionResult): string {
  if (result === "already_subscribed") {
    return "You are already on the bulletin list.";
  }

  if (result === "reactivated") {
    return "Welcome back to the weekly bulletin.";
  }

  return "You are subscribed to the weekly bulletin.";
}
