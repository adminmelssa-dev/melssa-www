import { NextResponse } from "next/server";
import { bulletinUnsubscribeInputSchema } from "@/modules/bulletin/contracts";
import { unsubscribeFromBulletin } from "@/modules/bulletin/server/subscriptions";
import { errorResult, successResult } from "@/lib/action-result";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const input = bulletinUnsubscribeInputSchema.parse(body);

    await unsubscribeFromBulletin(input.token);

    return NextResponse.json(successResult("You are unsubscribed."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Unsubscribe failed."), {
      status: 400,
    });
  }
}
