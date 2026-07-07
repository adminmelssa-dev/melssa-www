import { NextResponse } from "next/server";
import {
  adminBulletinMutationSchema,
  createBulletinIssueInputSchema,
  type AdminBulletinMutation,
} from "@/modules/bulletin/contracts";
import {
  getActiveBulletinSubscriberCount,
  getSerializedBulletinIssuePage,
} from "@/modules/bulletin/queries";
import {
  archiveBulletinIssue,
  createBulletinIssue,
  sendBulletinIssue,
  updateBulletinIssue,
} from "@/modules/bulletin/server/issues";
import { errorResult, successResult } from "@/lib/action-result";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET(request: Request) {
  const guard = await requireApiPermission({
    resource: "bulletin",
    action: "read",
  });
  if (!guard.ok) return guard.response;

  const query = parseDataTableQuery(new URL(request.url).searchParams);
  const [page, subscriberCount] = await Promise.all([
    getSerializedBulletinIssuePage(query),
    getActiveBulletinSubscriberCount(),
  ]);

  return NextResponse.json({
    bulletins: page.items,
    meta: page.meta,
    subscriberCount,
  });
}

export async function POST(request: Request) {
  try {
    const guard = await requireApiPermission({
      resource: "bulletin",
      action: "create",
    });
    if (!guard.ok) return guard.response;

    const body: unknown = await request.json();
    const input = createBulletinIssueInputSchema.parse(body);

    await createBulletinIssue({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Bulletin draft created."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Bulletin creation failed."), {
      status: 400,
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const body: unknown = await request.json();
    const mutation = adminBulletinMutationSchema.parse(body);
    const guard = await requireBulletinMutationPermission(mutation);
    if (!guard.ok) return guard.response;

    const message = await runBulletinMutation({
      actorUserId: guard.session.user.id,
      mutation,
    });

    return NextResponse.json(successResult(message));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Bulletin update failed."), {
      status: 400,
    });
  }
}

async function requireBulletinMutationPermission(
  mutation: AdminBulletinMutation,
) {
  if (mutation.type === "send") {
    return requireApiPermission({ resource: "bulletin", action: "send" });
  }

  if (mutation.type === "archive") {
    return requireApiPermission({ resource: "bulletin", action: "archive" });
  }

  return requireApiPermission({ resource: "bulletin", action: "update" });
}

async function runBulletinMutation({
  actorUserId,
  mutation,
}: {
  actorUserId: string;
  mutation: AdminBulletinMutation;
}): Promise<string> {
  if (mutation.type === "update") {
    await updateBulletinIssue({
      actorUserId,
      input: mutation.payload,
    });
    return "Bulletin saved.";
  }

  if (mutation.type === "archive") {
    await archiveBulletinIssue({
      actorUserId,
      input: mutation.payload,
    });
    return "Bulletin archived.";
  }

  const result = await sendBulletinIssue({
    actorUserId,
    input: mutation.payload,
  });

  if (result.failureCount > 0) {
    return `Bulletin sent to ${result.successCount} of ${result.recipientCount} subscribers.`;
  }

  return `Bulletin sent to ${result.successCount} subscribers.`;
}
