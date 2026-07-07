import { NextResponse } from "next/server";
import {
  adminFundraisingMutationSchema,
  createFundraisingCampaignInputSchema,
  deleteFundraisingCampaignInputSchema,
  type AdminFundraisingMutation,
} from "@/modules/fundraising/contracts";
import {
  getSerializedFundraisingCampaignPage,
  getSerializedFundraisingInquiryPage,
} from "@/modules/fundraising/queries";
import {
  createFundraisingCampaign,
  deleteFundraisingCampaign,
  updateFundraisingCampaign,
  updateFundraisingInquiry,
} from "@/modules/fundraising/server/fundraising";
import { errorResult, successResult } from "@/lib/action-result";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET() {
  const guard = await requireApiPermission({
    resource: "fundraising",
    action: "read",
  });
  if (!guard.ok) return guard.response;

  const [campaignPage, inquiryPage] = await Promise.all([
    getSerializedFundraisingCampaignPage(
      parseDataTableQuery(new URLSearchParams()),
    ),
    getSerializedFundraisingInquiryPage(
      parseDataTableQuery(new URLSearchParams()),
    ),
  ]);

  return NextResponse.json({
    campaignMeta: campaignPage.meta,
    campaigns: campaignPage.items,
    inquiries: inquiryPage.items,
    inquiryMeta: inquiryPage.meta,
  });
}

export async function POST(request: Request) {
  const guard = await requireApiPermission({
    resource: "fundraising",
    action: "create",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = createFundraisingCampaignInputSchema.parse(body);

    if (input.status === "published") {
      const publishGuard = await requireApiPermission({
        resource: "fundraising",
        action: "publish",
      });
      if (!publishGuard.ok) return publishGuard.response;
    }

    await createFundraisingCampaign({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Fundraising campaign created."));
  } catch (error) {
    return NextResponse.json(
      errorResult(error, "Fundraising campaign creation failed."),
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body: unknown = await request.json();
    const mutation = adminFundraisingMutationSchema.parse(body);
    const guard = await requireFundraisingMutationPermission(mutation);
    if (!guard.ok) return guard.response;

    await runFundraisingMutation({
      actorUserId: guard.session.user.id,
      mutation,
    });

    return NextResponse.json(successResult("Fundraising workspace updated."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Fundraising update failed."), {
      status: 400,
    });
  }
}

export async function DELETE(request: Request) {
  const guard = await requireApiPermission({
    resource: "fundraising",
    action: "delete",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = deleteFundraisingCampaignInputSchema.parse(body);

    await deleteFundraisingCampaign({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Fundraising campaign deleted."));
  } catch (error) {
    return NextResponse.json(
      errorResult(error, "Fundraising campaign deletion failed."),
      { status: 400 },
    );
  }
}

async function requireFundraisingMutationPermission(
  mutation: AdminFundraisingMutation,
) {
  if (mutation.type === "inquiry") {
    return requireApiPermission({
      resource: "fundraising",
      action: "respond",
    });
  }

  const updateGuard = await requireApiPermission({
    resource: "fundraising",
    action: "update",
  });
  if (!updateGuard.ok) return updateGuard;

  if (mutation.payload.status === "published") {
    const publishGuard = await requireApiPermission({
      resource: "fundraising",
      action: "publish",
    });
    if (!publishGuard.ok) return publishGuard;
  }

  return updateGuard;
}

async function runFundraisingMutation({
  actorUserId,
  mutation,
}: {
  actorUserId: string;
  mutation: AdminFundraisingMutation;
}): Promise<void> {
  if (mutation.type === "campaign") {
    await updateFundraisingCampaign({
      actorUserId,
      input: mutation.payload,
    });
    return;
  }

  await updateFundraisingInquiry({
    actorUserId,
    input: mutation.payload,
  });
}
