import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import {
  announcementCategorySchema,
  announcementRowSchema,
  type AnnouncementRow,
} from "@/modules/announcements/contracts";
import { contentStatusSchema } from "@/modules/content/contracts";
import {
  createDataTablePage,
  getDataTableFilterValues,
  getDataTableOffset,
  type DataTablePage,
  type DataTableQuery,
} from "@/lib/data-table-query";
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

export interface AnnouncementsAdminStats {
  totalAnnouncements: number;
  publishedAnnouncements: number;
  draftAnnouncements: number;
  archivedAnnouncements: number;
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

export async function getSerializedAnnouncementPage(
  query: DataTableQuery,
): Promise<DataTablePage<AnnouncementRow>> {
  const where = getAnnouncementWhere(query);
  const [totalRow] = await db
    .select({ value: count() })
    .from(announcements)
    .leftJoin(user, eq(user.id, announcements.authorId))
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, announcements.attachmentStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .where(where);
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
    .where(where)
    .orderBy(...getAnnouncementOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));

  return createDataTablePage({
    items: rows
      .map(mapAnnouncementRow)
      .map((announcement) => serializeAnnouncement(announcement)),
    query,
    totalRows: totalRow?.value ?? 0,
  });
}

export async function getAnnouncementsAdminStats(): Promise<
  AnnouncementsAdminStats
> {
  const [
    totalAnnouncements,
    publishedAnnouncements,
    draftAnnouncements,
    archivedAnnouncements,
  ] = await Promise.all([
    db.$count(announcements),
    db.$count(announcements, eq(announcements.status, "published")),
    db.$count(announcements, eq(announcements.status, "draft")),
    db.$count(announcements, eq(announcements.status, "archived")),
  ]);

  return {
    archivedAnnouncements,
    draftAnnouncements,
    publishedAnnouncements,
    totalAnnouncements,
  };
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

function getAnnouncementWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const categoryFilters = getValidCategoryFilters(
    getDataTableFilterValues(query, "category"),
  );
  const statusFilters = getValidStatusFilters(
    getDataTableFilterValues(query, "status"),
  );
  const attachmentFilters = getDataTableFilterValues(query, "attachmentStatus");

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(
      ilike(announcements.title, pattern),
      ilike(announcements.summary, pattern),
      ilike(announcements.body, pattern),
      ilike(storageObjects.originalFilename, pattern),
      ilike(user.name, pattern),
      ilike(user.email, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (categoryFilters.length > 0) {
    conditions.push(inArray(announcements.category, categoryFilters));
  }

  if (statusFilters.length > 0) {
    conditions.push(inArray(announcements.status, statusFilters));
  }

  if (attachmentFilters.length === 1) {
    const attachmentFilter = attachmentFilters[0];
    if (attachmentFilter === "has_attachment") {
      conditions.push(isNotNull(storageObjects.id));
    } else if (attachmentFilter === "no_attachment") {
      conditions.push(isNull(storageObjects.id));
    }
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getAnnouncementOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "title":
      return isAscending
        ? [asc(announcements.title), desc(announcements.id)]
        : [desc(announcements.title), desc(announcements.id)];
    case "category":
      return isAscending
        ? [asc(announcements.category), desc(announcements.id)]
        : [desc(announcements.category), desc(announcements.id)];
    case "status":
      return isAscending
        ? [asc(announcements.status), desc(announcements.id)]
        : [desc(announcements.status), desc(announcements.id)];
    case "attachment":
      return isAscending
        ? [asc(storageObjects.originalFilename), desc(announcements.id)]
        : [desc(storageObjects.originalFilename), desc(announcements.id)];
    case "publishedAt":
      return isAscending
        ? [asc(announcements.publishedAt), asc(announcements.id)]
        : [desc(announcements.publishedAt), desc(announcements.id)];
    default:
      return isAscending
        ? [asc(announcements.updatedAt), asc(announcements.id)]
        : [desc(announcements.updatedAt), desc(announcements.id)];
  }
}

function getValidCategoryFilters(values: string[]): AnnouncementRow["category"][] {
  return values.flatMap((value) => {
    const parsedValue = announcementCategorySchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}

function getValidStatusFilters(values: string[]): AnnouncementRow["status"][] {
  return values.flatMap((value) => {
    const parsedValue = contentStatusSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}
