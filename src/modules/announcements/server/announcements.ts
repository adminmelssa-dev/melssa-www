import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type {
  CreateAnnouncementInput,
  DeleteAnnouncementInput,
  UpdateAnnouncementInput,
} from "@/modules/announcements/contracts";
import { getNextContentPublishedAt } from "@/modules/content/contracts";
import { ExpectedError } from "@/lib/action-result";
import { writeAuditLog } from "@/server/audit/log";
import { db } from "@/server/db";
import {
  announcements,
  storageObjects,
} from "@/server/db/schema";
import { notifyAnnouncementPublished } from "@/server/notifications";
import { deleteStoredObjectById } from "@/server/storage/objects";

export async function createAnnouncement({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: CreateAnnouncementInput;
}): Promise<void> {
  await ensureAnnouncementAttachmentUsable(input.attachmentStorageObjectId);

  const [createdAnnouncement] = await db
    .insert(announcements)
    .values({
      title: input.title,
      summary: input.summary,
      body: input.body,
      category: input.category,
      status: input.status,
      authorId: actorUserId,
      attachmentStorageObjectId: input.attachmentStorageObjectId,
      publishedAt: input.status === "published" ? new Date() : null,
    })
    .returning({
      id: announcements.id,
      title: announcements.title,
    });

  if (!createdAnnouncement) {
    throw new Error("Announcement could not be created.");
  }

  await writeAuditLog({
    actorUserId,
    action: "announcement.create",
    entityType: "announcement",
    entityId: createdAnnouncement.id,
    summary: `Created announcement ${createdAnnouncement.title}.`,
    metadata: {
      title: createdAnnouncement.title,
      category: input.category,
      status: input.status,
      hasAttachment: input.attachmentStorageObjectId !== null,
    },
  });

  if (input.status === "published") {
    await notifyAnnouncementPublished({
      title: createdAnnouncement.title,
      category: input.category,
    });
  }

  revalidateAnnouncements();
}

export async function updateAnnouncement({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateAnnouncementInput;
}): Promise<void> {
  const existingAnnouncement = await getAnnouncementForMutation(
    input.announcementId,
  );
  await ensureAnnouncementAttachmentUsable(
    input.attachmentStorageObjectId,
    input.announcementId,
  );
  const nextPublishedAt = getNextContentPublishedAt({
    currentPublishedAt: existingAnnouncement.publishedAt,
    nextStatus: input.status,
    previousStatus: existingAnnouncement.status,
  });
  const shouldNotifyPublished =
    existingAnnouncement.status !== "published" && input.status === "published";

  await db
    .update(announcements)
    .set({
      title: input.title,
      summary: input.summary,
      body: input.body,
      category: input.category,
      status: input.status,
      attachmentStorageObjectId: input.attachmentStorageObjectId,
      publishedAt: nextPublishedAt,
      updatedAt: new Date(),
    })
    .where(eq(announcements.id, input.announcementId));

  if (
    existingAnnouncement.attachmentStorageObjectId &&
    existingAnnouncement.attachmentStorageObjectId !==
      input.attachmentStorageObjectId
  ) {
    await deleteStoredObjectById(existingAnnouncement.attachmentStorageObjectId);
  }

  await writeAuditLog({
    actorUserId,
    action: "announcement.update",
    entityType: "announcement",
    entityId: input.announcementId,
    summary: `Updated announcement ${input.title}.`,
    metadata: {
      previousTitle: existingAnnouncement.title,
      nextTitle: input.title,
      previousStatus: existingAnnouncement.status,
      nextStatus: input.status,
      previousCategory: existingAnnouncement.category,
      nextCategory: input.category,
    },
  });

  if (shouldNotifyPublished) {
    await notifyAnnouncementPublished({
      title: input.title,
      category: input.category,
    });
  }

  revalidateAnnouncements();
}

export async function deleteAnnouncement({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: DeleteAnnouncementInput;
}): Promise<void> {
  const existingAnnouncement = await getAnnouncementForMutation(
    input.announcementId,
  );

  await db
    .delete(announcements)
    .where(eq(announcements.id, input.announcementId));

  if (existingAnnouncement.attachmentStorageObjectId) {
    await deleteStoredObjectById(existingAnnouncement.attachmentStorageObjectId);
  }

  await writeAuditLog({
    actorUserId,
    action: "announcement.delete",
    entityType: "announcement",
    entityId: input.announcementId,
    summary: `Deleted announcement ${existingAnnouncement.title}.`,
    metadata: {
      title: existingAnnouncement.title,
      category: existingAnnouncement.category,
      status: existingAnnouncement.status,
    },
  });

  revalidateAnnouncements();
}

async function ensureAnnouncementAttachmentUsable(
  attachmentStorageObjectId: string | null,
  ignoredAnnouncementId?: number,
): Promise<void> {
  if (!attachmentStorageObjectId) return;

  const [object] = await db
    .select({
      id: storageObjects.id,
      endpoint: storageObjects.endpoint,
      status: storageObjects.status,
    })
    .from(storageObjects)
    .where(eq(storageObjects.id, attachmentStorageObjectId))
    .limit(1);

  if (!object) {
    throw new ExpectedError("Uploaded announcement attachment was not found.");
  }

  if (
    object.endpoint !== "announcementAttachment" ||
    object.status !== "completed"
  ) {
    throw new ExpectedError(
      "Uploaded file is not a completed announcement attachment.",
    );
  }

  const [existingAnnouncement] = await db
    .select({ id: announcements.id })
    .from(announcements)
    .where(eq(announcements.attachmentStorageObjectId, attachmentStorageObjectId))
    .limit(1);

  if (
    existingAnnouncement &&
    existingAnnouncement.id !== ignoredAnnouncementId
  ) {
    throw new ExpectedError("This attachment is already in use.");
  }
}

async function getAnnouncementForMutation(announcementId: number) {
  const [announcement] = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      category: announcements.category,
      status: announcements.status,
      attachmentStorageObjectId: announcements.attachmentStorageObjectId,
      publishedAt: announcements.publishedAt,
    })
    .from(announcements)
    .where(eq(announcements.id, announcementId))
    .limit(1);

  if (!announcement) {
    throw new ExpectedError("Announcement not found.");
  }

  return announcement;
}

function revalidateAnnouncements(): void {
  revalidatePath("/");
  revalidatePath("/announcements");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/announcements");
}
