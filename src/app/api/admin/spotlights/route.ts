import { NextResponse } from "next/server";
import {
  createSpotlightInputSchema,
  deleteSpotlightInputSchema,
  updateSpotlightInputSchema,
} from "@/modules/spotlights/contracts";
import { getSerializedSpotlightPage } from "@/modules/spotlights/queries";
import {
  createSpotlight,
  deleteSpotlight,
  updateSpotlight,
} from "@/modules/spotlights/server/spotlights";
import {
  errorResult,
  successResult,
} from "@/lib/action-result";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET(request: Request) {
  const guard = await requireApiPermission({
    resource: "spotlight",
    action: "read",
  });
  if (!guard.ok) return guard.response;

  const query = parseDataTableQuery(new URL(request.url).searchParams);
  const page = await getSerializedSpotlightPage(query);

  return NextResponse.json({ meta: page.meta, spotlights: page.items });
}

export async function POST(request: Request) {
  const guard = await requireApiPermission({
    resource: "spotlight",
    action: "create",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = createSpotlightInputSchema.parse(body);

    if (input.status === "published") {
      const publishGuard = await requireApiPermission({
        resource: "spotlight",
        action: "publish",
      });
      if (!publishGuard.ok) return publishGuard.response;
    }

    await createSpotlight({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Spotlight created."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Spotlight creation failed."), {
      status: 400,
    });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission({
    resource: "spotlight",
    action: "update",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = updateSpotlightInputSchema.parse(body);

    if (input.status === "published") {
      const publishGuard = await requireApiPermission({
        resource: "spotlight",
        action: "publish",
      });
      if (!publishGuard.ok) return publishGuard.response;
    }

    await updateSpotlight({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Spotlight updated."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Spotlight update failed."), {
      status: 400,
    });
  }
}

export async function DELETE(request: Request) {
  const guard = await requireApiPermission({
    resource: "spotlight",
    action: "delete",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = deleteSpotlightInputSchema.parse(body);

    await deleteSpotlight({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Spotlight deleted."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Spotlight deletion failed."), {
      status: 400,
    });
  }
}
