import { NextResponse } from "next/server";
import {
  adminUserMutationSchema,
  type AdminUserMutation,
} from "@/modules/auth/contracts";
import { getSerializedAdminUserPage } from "@/modules/auth/queries";
import { parseDataTableQuery } from "@/lib/data-table-query";
import {
  setAdminUserAccess,
  setAdminUserPermissionGrant,
  setAdminUserRole,
  setAdminUserVerification,
} from "@/modules/auth/server/users";
import { requireApiPermission } from "@/server/auth/api-guards";
import { errorResult, successResult } from "@/lib/action-result";

export async function GET(request: Request) {
  const guard = await requireApiPermission({ resource: "user", action: "list" });
  if (!guard.ok) return guard.response;

  const query = parseDataTableQuery(new URL(request.url).searchParams);
  const page = await getSerializedAdminUserPage(query);

  return NextResponse.json({ meta: page.meta, users: page.items });
}

export async function PATCH(request: Request) {
  try {
    const body: unknown = await request.json();
    const mutation = adminUserMutationSchema.parse(body);
    const guard = await requireAdminUserMutationPermission(mutation);
    if (!guard.ok) return guard.response;

    await runAdminUserMutation({
      actorUserId: guard.session.user.id,
      mutation,
    });

    return NextResponse.json(successResult("User updated."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "User update failed."), {
      status: 400,
    });
  }
}

async function requireAdminUserMutationPermission(mutation: AdminUserMutation) {
  if (mutation.type === "role") {
    return requireApiPermission({ resource: "user", action: "set-role" });
  }

  if (mutation.type === "access") {
    return requireApiPermission({ resource: "user", action: "ban" });
  }

  if (mutation.type === "permission") {
    return requireApiPermission({
      resource: "user",
      action: "manage-permissions",
    });
  }

  return requireApiPermission({ resource: "user", action: "update" });
}

async function runAdminUserMutation({
  actorUserId,
  mutation,
}: {
  actorUserId: string;
  mutation: AdminUserMutation;
}): Promise<void> {
  if (mutation.type === "role") {
    await setAdminUserRole({ actorUserId, input: mutation.payload });
    return;
  }

  if (mutation.type === "access") {
    await setAdminUserAccess({ actorUserId, input: mutation.payload });
    return;
  }

  if (mutation.type === "permission") {
    await setAdminUserPermissionGrant({
      actorUserId,
      input: mutation.payload,
    });
    return;
  }

  await setAdminUserVerification({ actorUserId, input: mutation.payload });
}
