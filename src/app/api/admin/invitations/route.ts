import { NextResponse } from "next/server";
import {
  adminInvitationMutationSchema,
  inviteAdminUserInputSchema,
  type AdminInvitationMutation,
} from "@/modules/auth/contracts";
import { getSerializedAdminInvitationPage } from "@/modules/auth/queries";
import {
  createAuthInvitation,
  resendAuthInvitation,
  revokeAuthInvitation,
} from "@/modules/auth/server/invitations";
import { errorResult, successResult } from "@/lib/action-result";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET(request: Request) {
  const guard = await requireApiPermission({
    resource: "user",
    action: "set-role",
  });
  if (!guard.ok) return guard.response;

  const query = parseDataTableQuery(new URL(request.url).searchParams, {
    defaultPageSize: 5,
  });
  const page = await getSerializedAdminInvitationPage(query);

  return NextResponse.json({ invitations: page.items, meta: page.meta });
}

export async function POST(request: Request) {
  try {
    const guard = await requireApiPermission({
      resource: "user",
      action: "set-role",
    });
    if (!guard.ok) return guard.response;

    const body: unknown = await request.json();
    const input = inviteAdminUserInputSchema.parse(body);

    await createAuthInvitation({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Invitation sent."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Invitation could not be sent."), {
      status: 400,
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const guard = await requireApiPermission({
      resource: "user",
      action: "set-role",
    });
    if (!guard.ok) return guard.response;

    const body: unknown = await request.json();
    const mutation = adminInvitationMutationSchema.parse(body);

    await runAdminInvitationMutation({
      actorUserId: guard.session.user.id,
      mutation,
    });

    return NextResponse.json(successResult("Invitation updated."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Invitation update failed."), {
      status: 400,
    });
  }
}

async function runAdminInvitationMutation({
  actorUserId,
  mutation,
}: {
  actorUserId: string;
  mutation: AdminInvitationMutation;
}): Promise<void> {
  if (mutation.type === "resend") {
    await resendAuthInvitation({
      actorUserId,
      invitationId: mutation.invitationId,
    });
    return;
  }

  await revokeAuthInvitation({
    actorUserId,
    invitationId: mutation.invitationId,
  });
}
