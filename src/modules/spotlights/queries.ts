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
  spotlightRowSchema,
  type SpotlightRow,
} from "@/modules/spotlights/contracts";
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
  storageObjects,
  studentSpotlights,
  user,
} from "@/server/db/schema";
import {
  getCachedJson,
  PUBLIC_CACHE_KEYS,
  PUBLIC_CACHE_TTL_SECONDS,
} from "@/server/cache";

interface SpotlightListItem {
  id: number;
  studentName: string;
  headline: string;
  body: string;
  status: SpotlightRow["status"];
  photo: SpotlightRow["photo"];
  creator: SpotlightRow["creator"];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SpotlightQueryRow {
  id: number;
  studentName: string;
  headline: string;
  body: string;
  status: SpotlightRow["status"];
  photoId: string | null;
  photoPublicUrl: string | null;
  photoObjectKey: string | null;
  photoOriginalFilename: string | null;
  photoMimeType: string | null;
  photoByteSize: number | null;
  creatorId: string | null;
  creatorName: string | null;
  creatorEmail: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpotlightsAdminStats {
  totalSpotlights: number;
  publishedSpotlights: number;
  draftSpotlights: number;
  archivedSpotlights: number;
}

export async function getSpotlights(): Promise<SpotlightListItem[]> {
  const rows = await spotlightSelect()
    .from(studentSpotlights)
    .leftJoin(user, eq(user.id, studentSpotlights.createdById))
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, studentSpotlights.photoStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .orderBy(
      desc(studentSpotlights.publishedAt),
      desc(studentSpotlights.createdAt),
    );

  return rows.map(mapSpotlightRow);
}

export async function getPublishedSpotlights(): Promise<SpotlightListItem[]> {
  const rows = await spotlightSelect()
    .from(studentSpotlights)
    .leftJoin(user, eq(user.id, studentSpotlights.createdById))
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, studentSpotlights.photoStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .where(eq(studentSpotlights.status, "published"))
    .orderBy(
      desc(studentSpotlights.publishedAt),
      desc(studentSpotlights.createdAt),
    );

  return rows.map(mapSpotlightRow);
}

export function serializeSpotlight(item: SpotlightListItem): SpotlightRow {
  return {
    id: item.id,
    studentName: item.studentName,
    headline: item.headline,
    body: item.body,
    status: item.status,
    photo: item.photo,
    creator: item.creator,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getSerializedSpotlights(): Promise<SpotlightRow[]> {
  const spotlights = await getSpotlights();
  return spotlights.map((spotlight) => serializeSpotlight(spotlight));
}

export async function getSerializedSpotlightPage(
  query: DataTableQuery,
): Promise<DataTablePage<SpotlightRow>> {
  const where = getSpotlightWhere(query);
  const [totalRow] = await db
    .select({ value: count() })
    .from(studentSpotlights)
    .leftJoin(user, eq(user.id, studentSpotlights.createdById))
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, studentSpotlights.photoStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .where(where);
  const rows = await spotlightSelect()
    .from(studentSpotlights)
    .leftJoin(user, eq(user.id, studentSpotlights.createdById))
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, studentSpotlights.photoStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .where(where)
    .orderBy(...getSpotlightOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));

  return createDataTablePage({
    items: rows.map(mapSpotlightRow).map((spotlight) => serializeSpotlight(spotlight)),
    query,
    totalRows: totalRow?.value ?? 0,
  });
}

export async function getSpotlightsAdminStats(): Promise<SpotlightsAdminStats> {
  const [
    totalSpotlights,
    publishedSpotlights,
    draftSpotlights,
    archivedSpotlights,
  ] = await Promise.all([
    db.$count(studentSpotlights),
    db.$count(studentSpotlights, eq(studentSpotlights.status, "published")),
    db.$count(studentSpotlights, eq(studentSpotlights.status, "draft")),
    db.$count(studentSpotlights, eq(studentSpotlights.status, "archived")),
  ]);

  return {
    archivedSpotlights,
    draftSpotlights,
    publishedSpotlights,
    totalSpotlights,
  };
}

export async function getSerializedPublishedSpotlights(): Promise<
  SpotlightRow[]
> {
  return getCachedJson({
    key: PUBLIC_CACHE_KEYS.spotlights,
    load: async () => {
      const spotlights = await getPublishedSpotlights();
      return spotlights.map((spotlight) => serializeSpotlight(spotlight));
    },
    schema: z.array(spotlightRowSchema),
    ttlSeconds: PUBLIC_CACHE_TTL_SECONDS,
  });
}

function spotlightSelect() {
  return db.select({
    id: studentSpotlights.id,
    studentName: studentSpotlights.studentName,
    headline: studentSpotlights.headline,
    body: studentSpotlights.body,
    status: studentSpotlights.status,
    photoId: storageObjects.id,
    photoPublicUrl: storageObjects.publicUrl,
    photoObjectKey: storageObjects.objectKey,
    photoOriginalFilename: storageObjects.originalFilename,
    photoMimeType: storageObjects.mimeType,
    photoByteSize: storageObjects.byteSize,
    creatorId: user.id,
    creatorName: user.name,
    creatorEmail: user.email,
    publishedAt: studentSpotlights.publishedAt,
    createdAt: studentSpotlights.createdAt,
    updatedAt: studentSpotlights.updatedAt,
  });
}

function mapSpotlightRow(row: SpotlightQueryRow): SpotlightListItem {
  return {
    id: row.id,
    studentName: row.studentName,
    headline: row.headline,
    body: row.body,
    status: row.status,
    photo:
      row.photoId &&
      row.photoPublicUrl &&
      row.photoObjectKey &&
      row.photoOriginalFilename &&
      row.photoMimeType &&
      row.photoByteSize !== null
        ? {
            id: row.photoId,
            publicUrl: row.photoPublicUrl,
            objectKey: row.photoObjectKey,
            originalFilename: row.photoOriginalFilename,
            mimeType: row.photoMimeType,
            byteSize: row.photoByteSize,
          }
        : null,
    creator:
      row.creatorId && row.creatorName && row.creatorEmail
        ? {
            id: row.creatorId,
            name: row.creatorName,
            email: row.creatorEmail,
          }
        : null,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function getSpotlightWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const statusFilters = getValidStatusFilters(
    getDataTableFilterValues(query, "status"),
  );
  const photoFilters = getDataTableFilterValues(query, "photoStatus");

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(
      ilike(studentSpotlights.studentName, pattern),
      ilike(studentSpotlights.headline, pattern),
      ilike(studentSpotlights.body, pattern),
      ilike(storageObjects.originalFilename, pattern),
      ilike(user.name, pattern),
      ilike(user.email, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (statusFilters.length > 0) {
    conditions.push(inArray(studentSpotlights.status, statusFilters));
  }

  if (photoFilters.length === 1) {
    const photoFilter = photoFilters[0];
    if (photoFilter === "has_photo") {
      conditions.push(isNotNull(storageObjects.id));
    } else if (photoFilter === "no_photo") {
      conditions.push(isNull(storageObjects.id));
    }
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getSpotlightOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "studentName":
      return isAscending
        ? [asc(studentSpotlights.studentName), desc(studentSpotlights.id)]
        : [desc(studentSpotlights.studentName), desc(studentSpotlights.id)];
    case "headline":
      return isAscending
        ? [asc(studentSpotlights.headline), desc(studentSpotlights.id)]
        : [desc(studentSpotlights.headline), desc(studentSpotlights.id)];
    case "status":
      return isAscending
        ? [asc(studentSpotlights.status), desc(studentSpotlights.id)]
        : [desc(studentSpotlights.status), desc(studentSpotlights.id)];
    case "photo":
      return isAscending
        ? [asc(storageObjects.originalFilename), desc(studentSpotlights.id)]
        : [desc(storageObjects.originalFilename), desc(studentSpotlights.id)];
    case "publishedAt":
      return isAscending
        ? [asc(studentSpotlights.publishedAt), asc(studentSpotlights.id)]
        : [desc(studentSpotlights.publishedAt), desc(studentSpotlights.id)];
    default:
      return isAscending
        ? [asc(studentSpotlights.updatedAt), asc(studentSpotlights.id)]
        : [desc(studentSpotlights.updatedAt), desc(studentSpotlights.id)];
  }
}

function getValidStatusFilters(values: string[]): SpotlightRow["status"][] {
  return values.flatMap((value) => {
    const parsedValue = contentStatusSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}
