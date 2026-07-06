import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type {
  CreateGalleryItemInput,
  DeleteGalleryItemInput,
  UpdateGalleryItemInput,
} from "@/modules/gallery/contracts";
import { ExpectedError } from "@/lib/action-result";
import { writeAuditLog } from "@/server/audit/log";
import { db } from "@/server/db";
import {
  galleryItems,
  storageObjects,
} from "@/server/db/schema";
import { deleteStoredObjectById } from "@/server/storage/objects";

export async function createGalleryItem({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: CreateGalleryItemInput;
}): Promise<void> {
  await ensureGalleryImageUsable(input.storageObjectId);

  const [createdItem] = await db
    .insert(galleryItems)
    .values({
      title: input.title,
      caption: input.caption,
      type: input.type,
      storageObjectId: input.storageObjectId,
      isFeatured: input.isFeatured,
      capturedAt: input.capturedAt ? new Date(input.capturedAt) : null,
      createdById: actorUserId,
    })
    .returning({
      id: galleryItems.id,
      title: galleryItems.title,
    });

  if (!createdItem) {
    throw new Error("Gallery item could not be created.");
  }

  await writeAuditLog({
    actorUserId,
    action: "gallery.create",
    entityType: "gallery_item",
    entityId: createdItem.id,
    summary: `Created gallery item ${createdItem.title}.`,
    metadata: {
      title: createdItem.title,
      type: input.type,
      isFeatured: input.isFeatured,
    },
  });

  revalidateGallery();
}

export async function updateGalleryItem({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateGalleryItemInput;
}): Promise<void> {
  const existingItem = await getGalleryItemForMutation(input.galleryItemId);
  await ensureGalleryImageUsable(input.storageObjectId, input.galleryItemId);

  await db
    .update(galleryItems)
    .set({
      title: input.title,
      caption: input.caption,
      type: input.type,
      storageObjectId: input.storageObjectId,
      isFeatured: input.isFeatured,
      capturedAt: input.capturedAt ? new Date(input.capturedAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(galleryItems.id, input.galleryItemId));

  if (existingItem.storageObjectId !== input.storageObjectId) {
    await deleteStoredObjectById(existingItem.storageObjectId);
  }

  await writeAuditLog({
    actorUserId,
    action: "gallery.update",
    entityType: "gallery_item",
    entityId: input.galleryItemId,
    summary: `Updated gallery item ${input.title}.`,
    metadata: {
      previousTitle: existingItem.title,
      nextTitle: input.title,
      previousType: existingItem.type,
      nextType: input.type,
      isFeatured: input.isFeatured,
    },
  });

  revalidateGallery();
}

export async function deleteGalleryItem({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: DeleteGalleryItemInput;
}): Promise<void> {
  const existingItem = await getGalleryItemForMutation(input.galleryItemId);

  await db.delete(galleryItems).where(eq(galleryItems.id, input.galleryItemId));
  await deleteStoredObjectById(existingItem.storageObjectId);

  await writeAuditLog({
    actorUserId,
    action: "gallery.delete",
    entityType: "gallery_item",
    entityId: input.galleryItemId,
    summary: `Deleted gallery item ${existingItem.title}.`,
    metadata: {
      title: existingItem.title,
      type: existingItem.type,
      isFeatured: existingItem.isFeatured,
    },
  });

  revalidateGallery();
}

async function ensureGalleryImageUsable(
  storageObjectId: string,
  ignoredGalleryItemId?: number,
): Promise<void> {
  const [object] = await db
    .select({
      id: storageObjects.id,
      endpoint: storageObjects.endpoint,
      status: storageObjects.status,
    })
    .from(storageObjects)
    .where(eq(storageObjects.id, storageObjectId))
    .limit(1);

  if (!object) {
    throw new ExpectedError("Uploaded gallery image was not found.");
  }

  if (object.endpoint !== "galleryImage" || object.status !== "completed") {
    throw new ExpectedError("Uploaded file is not a completed gallery image.");
  }

  const [existingItem] = await db
    .select({ id: galleryItems.id })
    .from(galleryItems)
    .where(eq(galleryItems.storageObjectId, storageObjectId))
    .limit(1);

  if (existingItem && existingItem.id !== ignoredGalleryItemId) {
    throw new ExpectedError("This image is already in the gallery.");
  }
}

async function getGalleryItemForMutation(galleryItemId: number) {
  const [item] = await db
    .select({
      id: galleryItems.id,
      title: galleryItems.title,
      type: galleryItems.type,
      storageObjectId: galleryItems.storageObjectId,
      isFeatured: galleryItems.isFeatured,
    })
    .from(galleryItems)
    .where(eq(galleryItems.id, galleryItemId))
    .limit(1);

  if (!item) {
    throw new ExpectedError("Gallery item not found.");
  }

  return item;
}

function revalidateGallery(): void {
  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/gallery");
}
