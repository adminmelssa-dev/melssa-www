import { NextResponse } from "next/server";
import { acceptAuthInvitationInputSchema } from "@/modules/auth/contracts";
import { acceptAuthInvitation } from "@/modules/auth/server/invitations";
import { errorResult, successResult } from "@/lib/action-result";
import { requireApiAuth } from "@/server/auth/api-guards";

export async function POST(request: Request) {
  try {
    const guard = await requireApiAuth();
    if (!guard.ok) return guard.response;

    const body: unknown = await request.json();
    const input = acceptAuthInvitationInputSchema.parse(body);

    await acceptAuthInvitation({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Invitation accepted."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Invitation could not be accepted."), {
      status: 400,
    });
  }
}
