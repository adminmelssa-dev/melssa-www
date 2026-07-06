import { NextResponse } from "next/server";
import { profileSessionMutationSchema } from "@/modules/profile/contracts";
import {
  revokeOtherUserSessions,
  revokeUserSession,
} from "@/modules/profile/server/sessions";
import {
  errorResult,
  successResult,
} from "@/lib/action-result";
import { requireApiAuth } from "@/server/auth/api-guards";

export async function POST(request: Request) {
  const guard = await requireApiAuth();
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = profileSessionMutationSchema.parse(body);

    if (input.intent === "revoke") {
      await revokeUserSession(input.sessionId);
      return NextResponse.json(successResult("Session revoked."));
    }

    await revokeOtherUserSessions();
    return NextResponse.json(successResult("Other sessions revoked."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Session update failed."), {
      status: 400,
    });
  }
}
