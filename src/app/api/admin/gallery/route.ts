import { NextResponse } from "next/server";
import {
  createGalleryItemInputSchema,
  deleteGalleryItemInputSchema,
  updateGalleryItemInputSchema,
} from "@/modules/gallery/contracts";
import { getSerializedGalleryItemPage } from "@/modules/gallery/queries";
import {
  createGalleryItem,
  deleteGalleryItem,
  updateGalleryItem,
} from "@/modules/gallery/server/gallery";
import {
  errorResult,
  successResult,
} from "@/lib/action-result";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requireApiPermission } from "@/server/auth/api-guards";

export async function GET(request: Request) {
  const guard = await requireApiPermission({
    resource: "gallery",
    action: "read",
  });
  if (!guard.ok) return guard.response;

  const query = parseDataTableQuery(new URL(request.url).searchParams);
  const page = await getSerializedGalleryItemPage(query);

  return NextResponse.json({ galleryItems: page.items, meta: page.meta });
}

export async function POST(request: Request) {
  const guard = await requireApiPermission({
    resource: "gallery",
    action: "create",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = createGalleryItemInputSchema.parse(body);

    await createGalleryItem({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Gallery item created."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Gallery creation failed."), {
      status: 400,
    });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission({
    resource: "gallery",
    action: "update",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = updateGalleryItemInputSchema.parse(body);

    await updateGalleryItem({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Gallery item updated."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Gallery update failed."), {
      status: 400,
    });
  }
}

export async function DELETE(request: Request) {
  const guard = await requireApiPermission({
    resource: "gallery",
    action: "delete",
  });
  if (!guard.ok) return guard.response;

  try {
    const body: unknown = await request.json();
    const input = deleteGalleryItemInputSchema.parse(body);

    await deleteGalleryItem({
      actorUserId: guard.session.user.id,
      input,
    });

    return NextResponse.json(successResult("Gallery item deleted."));
  } catch (error) {
    return NextResponse.json(errorResult(error, "Gallery deletion failed."), {
      status: 400,
    });
  }
}
