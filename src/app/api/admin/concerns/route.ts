import { NextResponse } from "next/server";
import { updateConcernInputSchema } from "@/modules/concerns/contracts";
import { getSerializedConcernPage } from "@/modules/concerns/queries";
import { updateConcern } from "@/modules/concerns/server/concerns";
import { parseDataTableQuery } from "@/lib/data-table-query";
import {
  errorResult,
  successResult,
} from "@/lib/action-result";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET(request: Request) {
  const guard = await requireApiPermission({
    resource: "concern",
    action: "read",
  });
  if (!guard.ok) return guard.response;

  const query = parseDataTableQuery(new URL(request.url).searchParams);
  const page = await getSerializedConcernPage(query);

  return NextResponse.json({ concerns: page.items, meta: page.meta });
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission({
    resource: "concern",
    action: "update",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = updateConcernInputSchema.parse(body);

    if (input.status === "archived") {
      const archiveGuard = await requireApiPermission({
        resource: "concern",
        action: "archive",
      });
      if (!archiveGuard.ok) return archiveGuard.response;
    }

    await updateConcern({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Concern updated."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Concern update failed."), {
      status: 400,
    });
  }
}
