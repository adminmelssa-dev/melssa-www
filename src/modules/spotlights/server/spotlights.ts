import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getNextContentPublishedAt } from "@/modules/content/contracts";
import type {
  CreateSpotlightInput,
  DeleteSpotlightInput,
  UpdateSpotlightInput,
} from "@/modules/spotlights/contracts";
import { ExpectedError } from "@/lib/action-result";
import { writeAuditLog } from "@/server/audit/log";
import { db } from "@/server/db";
import {
  storageObjects,
  studentSpotlights,
} from "@/server/db/schema";
import { invalidateCacheKeys, PUBLIC_CACHE_KEYS } from "@/server/cache";
import { deleteStoredObjectById } from "@/server/storage/objects";

export async function createSpotlight({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: CreateSpotlightInput;
}): Promise<void> {
  await ensureSpotlightPhotoUsable(input.photoStorageObjectId);

  const [createdSpotlight] = await db
    .insert(studentSpotlights)
    .values({
      studentName: input.studentName,
      headline: input.headline,
      body: input.body,
      status: input.status,
      photoStorageObjectId: input.photoStorageObjectId,
      createdById: actorUserId,
      publishedAt: input.status === "published" ? new Date() : null,
    })
    .returning({
      id: studentSpotlights.id,
      studentName: studentSpotlights.studentName,
    });

  if (!createdSpotlight) {
    throw new Error("Spotlight could not be created.");
  }

  await writeAuditLog({
    actorUserId,
    action: "spotlight.create",
    entityType: "student_spotlight",
    entityId: createdSpotlight.id,
    summary: `Created spotlight for ${createdSpotlight.studentName}.`,
    metadata: {
      studentName: createdSpotlight.studentName,
      status: input.status,
      hasPhoto: input.photoStorageObjectId !== null,
    },
  });

  await revalidateSpotlights();
}

export async function updateSpotlight({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateSpotlightInput;
}): Promise<void> {
  const existingSpotlight = await getSpotlightForMutation(input.spotlightId);
  await ensureSpotlightPhotoUsable(
    input.photoStorageObjectId,
    input.spotlightId,
  );
  const nextPublishedAt = getNextContentPublishedAt({
    currentPublishedAt: existingSpotlight.publishedAt,
    nextStatus: input.status,
    previousStatus: existingSpotlight.status,
  });

  await db
    .update(studentSpotlights)
    .set({
      studentName: input.studentName,
      headline: input.headline,
      body: input.body,
      status: input.status,
      photoStorageObjectId: input.photoStorageObjectId,
      publishedAt: nextPublishedAt,
      updatedAt: new Date(),
    })
    .where(eq(studentSpotlights.id, input.spotlightId));

  if (
    existingSpotlight.photoStorageObjectId &&
    existingSpotlight.photoStorageObjectId !== input.photoStorageObjectId
  ) {
    await deleteStoredObjectById(existingSpotlight.photoStorageObjectId);
  }

  await writeAuditLog({
    actorUserId,
    action: "spotlight.update",
    entityType: "student_spotlight",
    entityId: input.spotlightId,
    summary: `Updated spotlight for ${input.studentName}.`,
    metadata: {
      previousStudentName: existingSpotlight.studentName,
      nextStudentName: input.studentName,
      previousStatus: existingSpotlight.status,
      nextStatus: input.status,
      hasPhoto: input.photoStorageObjectId !== null,
    },
  });

  await revalidateSpotlights();
}

export async function deleteSpotlight({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: DeleteSpotlightInput;
}): Promise<void> {
  const existingSpotlight = await getSpotlightForMutation(input.spotlightId);

  await db
    .delete(studentSpotlights)
    .where(eq(studentSpotlights.id, input.spotlightId));

  if (existingSpotlight.photoStorageObjectId) {
    await deleteStoredObjectById(existingSpotlight.photoStorageObjectId);
  }

  await writeAuditLog({
    actorUserId,
    action: "spotlight.delete",
    entityType: "student_spotlight",
    entityId: input.spotlightId,
    summary: `Deleted spotlight for ${existingSpotlight.studentName}.`,
    metadata: {
      studentName: existingSpotlight.studentName,
      status: existingSpotlight.status,
    },
  });

  await revalidateSpotlights();
}

async function ensureSpotlightPhotoUsable(
  photoStorageObjectId: string | null,
  ignoredSpotlightId?: number,
): Promise<void> {
  if (!photoStorageObjectId) return;

  const [object] = await db
    .select({
      id: storageObjects.id,
      endpoint: storageObjects.endpoint,
      status: storageObjects.status,
    })
    .from(storageObjects)
    .where(eq(storageObjects.id, photoStorageObjectId))
    .limit(1);

  if (!object) {
    throw new ExpectedError("Uploaded spotlight photo was not found.");
  }

  if (object.endpoint !== "spotlightPhoto" || object.status !== "completed") {
    throw new ExpectedError("Uploaded file is not a completed spotlight photo.");
  }

  const [existingSpotlight] = await db
    .select({ id: studentSpotlights.id })
    .from(studentSpotlights)
    .where(eq(studentSpotlights.photoStorageObjectId, photoStorageObjectId))
    .limit(1);

  if (existingSpotlight && existingSpotlight.id !== ignoredSpotlightId) {
    throw new ExpectedError("This spotlight photo is already in use.");
  }
}

async function getSpotlightForMutation(spotlightId: number) {
  const [spotlight] = await db
    .select({
      id: studentSpotlights.id,
      studentName: studentSpotlights.studentName,
      status: studentSpotlights.status,
      photoStorageObjectId: studentSpotlights.photoStorageObjectId,
      publishedAt: studentSpotlights.publishedAt,
    })
    .from(studentSpotlights)
    .where(eq(studentSpotlights.id, spotlightId))
    .limit(1);

  if (!spotlight) {
    throw new ExpectedError("Spotlight not found.");
  }

  return spotlight;
}

async function revalidateSpotlights(): Promise<void> {
  revalidatePath("/");
  revalidatePath("/spotlight");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/spotlight");
  await invalidateCacheKeys([PUBLIC_CACHE_KEYS.spotlights]);
}
