import { NextResponse } from "next/server";
import { subscribeToBulletinInputSchema } from "@/modules/bulletin/contracts";
import {
  subscribeToBulletin,
  type BulletinSubscriptionResult,
} from "@/modules/bulletin/server/subscriptions";
import { errorResult, successResult } from "@/lib/action-result";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const input = subscribeToBulletinInputSchema.parse(body);
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
