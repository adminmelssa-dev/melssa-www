import { NextResponse } from "next/server";
import {
  createResourceInputSchema,
  deleteResourceInputSchema,
  updateResourceInputSchema,
} from "@/modules/resources/contracts";
import { getSerializedResourcePage } from "@/modules/resources/queries";
import {
  createResource,
  deleteResource,
  updateResource,
} from "@/modules/resources/server/resources";
import { errorResult, successResult } from "@/lib/action-result";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET(request: Request) {
  const guard = await requireApiPermission({
    resource: "resource",
    action: "read",
  });
  if (!guard.ok) return guard.response;

  const query = parseDataTableQuery(new URL(request.url).searchParams);
  const page = await getSerializedResourcePage(query);

  return NextResponse.json({ meta: page.meta, resources: page.items });
}

export async function POST(request: Request) {
  const guard = await requireApiPermission({
    resource: "resource",
    action: "create",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = createResourceInputSchema.parse(body);

    if (input.status === "published") {
      const publishGuard = await requireApiPermission({
        resource: "resource",
        action: "publish",
      });
      if (!publishGuard.ok) return publishGuard.response;
    }

    await createResource({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Resource created."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Resource creation failed."), {
      status: 400,
    });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission({
    resource: "resource",
    action: "update",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = updateResourceInputSchema.parse(body);

    if (input.status === "published") {
      const publishGuard = await requireApiPermission({
        resource: "resource",
        action: "publish",
      });
      if (!publishGuard.ok) return publishGuard.response;
    }

    await updateResource({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Resource updated."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Resource update failed."), {
      status: 400,
    });
  }
}

export async function DELETE(request: Request) {
  const guard = await requireApiPermission({
    resource: "resource",
    action: "delete",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = deleteResourceInputSchema.parse(body);

    await deleteResource({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Resource deleted."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Resource deletion failed."), {
      status: 400,
    });
  }
}
