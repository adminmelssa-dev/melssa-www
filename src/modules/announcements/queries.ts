import "server-only";

import {
  and,
  desc,
  eq,
} from "drizzle-orm";
import { z } from "zod";
import {
  announcementRowSchema,
  type AnnouncementRow,
} from "@/modules/announcements/contracts";
import { db } from "@/server/db";
import {
  announcements,
  storageObjects,
  user,
} from "@/server/db/schema";
import {
  getCachedJson,
  PUBLIC_CACHE_KEYS,
  PUBLIC_CACHE_TTL_SECONDS,
} from "@/server/cache";

interface AnnouncementListItem {
  id: number;
  title: string;
  summary: string | null;
  body: string;
  category: AnnouncementRow["category"];
  status: AnnouncementRow["status"];
  author: AnnouncementRow["author"];
  attachment: AnnouncementRow["attachment"];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AnnouncementQueryRow {
  id: number;
  title: string;
  summary: string | null;
  body: string;
  category: AnnouncementRow["category"];
  status: AnnouncementRow["status"];
  authorId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  attachmentId: string | null;
  attachmentPublicUrl: string | null;
  attachmentObjectKey: string | null;
  attachmentOriginalFilename: string | null;
  attachmentMimeType: string | null;
  attachmentByteSize: number | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getAnnouncements(): Promise<AnnouncementListItem[]> {
  const rows = await announcementSelect()
    .from(announcements)
    .leftJoin(user, eq(user.id, announcements.authorId))
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, announcements.attachmentStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .orderBy(desc(announcements.createdAt));

  return rows.map(mapAnnouncementRow);
}

export async function getPublishedAnnouncements(): Promise<
  AnnouncementListItem[]
> {
  const rows = await announcementSelect()
    .from(announcements)
    .leftJoin(user, eq(user.id, announcements.authorId))
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, announcements.attachmentStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .where(eq(announcements.status, "published"))
    .orderBy(desc(announcements.publishedAt), desc(announcements.createdAt));

  return rows.map(mapAnnouncementRow);
}

export function serializeAnnouncement(
  item: AnnouncementListItem,
): AnnouncementRow {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    body: item.body,
    category: item.category,
    status: item.status,
    author: item.author,
    attachment: item.attachment,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getSerializedAnnouncements(): Promise<AnnouncementRow[]> {
  const announcementRows = await getAnnouncements();
  return announcementRows.map((item) => serializeAnnouncement(item));
}

export async function getSerializedPublishedAnnouncements(): Promise<
  AnnouncementRow[]
> {
  return getCachedJson({
    key: PUBLIC_CACHE_KEYS.announcements,
    load: async () => {
      const announcementRows = await getPublishedAnnouncements();
      return announcementRows.map((item) => serializeAnnouncement(item));
    },
    schema: z.array(announcementRowSchema),
    ttlSeconds: PUBLIC_CACHE_TTL_SECONDS,
  });
}

function announcementSelect() {
  return db.select({
    id: announcements.id,
    title: announcements.title,
    summary: announcements.summary,
    body: announcements.body,
    category: announcements.category,
    status: announcements.status,
    authorId: user.id,
    authorName: user.name,
    authorEmail: user.email,
    attachmentId: storageObjects.id,
    attachmentPublicUrl: storageObjects.publicUrl,
    attachmentObjectKey: storageObjects.objectKey,
    attachmentOriginalFilename: storageObjects.originalFilename,
    attachmentMimeType: storageObjects.mimeType,
    attachmentByteSize: storageObjects.byteSize,
    publishedAt: announcements.publishedAt,
    createdAt: announcements.createdAt,
    updatedAt: announcements.updatedAt,
  });
}

function mapAnnouncementRow(row: AnnouncementQueryRow): AnnouncementListItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    body: row.body,
    category: row.category,
    status: row.status,
    author:
      row.authorId && row.authorName && row.authorEmail
        ? {
            id: row.authorId,
            name: row.authorName,
            email: row.authorEmail,
          }
        : null,
    attachment:
      row.attachmentId &&
      row.attachmentPublicUrl &&
      row.attachmentObjectKey &&
      row.attachmentOriginalFilename &&
      row.attachmentMimeType &&
      row.attachmentByteSize !== null
        ? {
            id: row.attachmentId,
            publicUrl: row.attachmentPublicUrl,
            objectKey: row.attachmentObjectKey,
            originalFilename: row.attachmentOriginalFilename,
            mimeType: row.attachmentMimeType,
            byteSize: row.attachmentByteSize,
          }
        : null,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
