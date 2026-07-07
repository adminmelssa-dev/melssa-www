import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import {
  galleryItemTypeSchema,
  galleryItemRowSchema,
  type GalleryItemRow,
} from "@/modules/gallery/contracts";
import {
  createDataTablePage,
  getDataTableFilterValues,
  getDataTableOffset,
  type DataTablePage,
  type DataTableQuery,
} from "@/lib/data-table-query";
import { db } from "@/server/db";
import {
  galleryItems,
  storageObjects,
  user,
} from "@/server/db/schema";
import {
  getCachedJson,
  PUBLIC_CACHE_KEYS,
  PUBLIC_CACHE_TTL_SECONDS,
} from "@/server/cache";

interface GalleryListItem {
  id: number;
  title: string;
  caption: string | null;
  type: GalleryItemRow["type"];
  image: GalleryItemRow["image"];
  isFeatured: boolean;
  capturedAt: Date | null;
  creator: GalleryItemRow["creator"];
  createdAt: Date;
  updatedAt: Date;
}

interface GalleryQueryRow {
  id: number;
  title: string;
  caption: string | null;
  type: GalleryItemRow["type"];
  imageId: string;
  imagePublicUrl: string;
  imageObjectKey: string;
  imageOriginalFilename: string;
  imageMimeType: string;
  imageByteSize: number;
  isFeatured: boolean;
  capturedAt: Date | null;
  creatorId: string | null;
  creatorName: string | null;
  creatorEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GalleryAdminStats {
  totalItems: number;
  featuredItems: number;
  typedItems: number;
}

export async function getGalleryItems(): Promise<GalleryListItem[]> {
  const rows = await gallerySelect()
    .from(galleryItems)
    .innerJoin(
      storageObjects,
      and(
        eq(storageObjects.id, galleryItems.storageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .leftJoin(user, eq(user.id, galleryItems.createdById))
    .orderBy(
      desc(galleryItems.isFeatured),
      desc(galleryItems.capturedAt),
      desc(galleryItems.createdAt),
    );

  return rows.map(mapGalleryRow);
}

export function serializeGalleryItem(item: GalleryListItem): GalleryItemRow {
  return {
    id: item.id,
    title: item.title,
    caption: item.caption,
    type: item.type,
    image: item.image,
    isFeatured: item.isFeatured,
    capturedAt: item.capturedAt?.toISOString() ?? null,
    creator: item.creator,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getSerializedGalleryItems(): Promise<GalleryItemRow[]> {
  const items = await getGalleryItems();
  return items.map((item) => serializeGalleryItem(item));
}

export async function getSerializedGalleryItemPage(
  query: DataTableQuery,
): Promise<DataTablePage<GalleryItemRow>> {
  const where = getGalleryWhere(query);
  const [totalRow] = await db
    .select({ value: count() })
    .from(galleryItems)
    .innerJoin(
      storageObjects,
      and(
        eq(storageObjects.id, galleryItems.storageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .leftJoin(user, eq(user.id, galleryItems.createdById))
    .where(where);
  const rows = await gallerySelect()
    .from(galleryItems)
    .innerJoin(
      storageObjects,
      and(
        eq(storageObjects.id, galleryItems.storageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .leftJoin(user, eq(user.id, galleryItems.createdById))
    .where(where)
    .orderBy(...getGalleryOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));

  return createDataTablePage({
    items: rows.map(mapGalleryRow).map((item) => serializeGalleryItem(item)),
    query,
    totalRows: totalRow?.value ?? 0,
  });
}

export async function getGalleryAdminStats(): Promise<GalleryAdminStats> {
  const [totalItems, featuredItems, typedItems] = await Promise.all([
    db.$count(galleryItems),
    db.$count(galleryItems, eq(galleryItems.isFeatured, true)),
    db.$count(galleryItems, inArray(galleryItems.type, [
      "event",
      "seminar",
      "health_screening",
      "congress",
      "outreach",
    ])),
  ]);

  return { featuredItems, totalItems, typedItems };
}

export async function getCachedSerializedGalleryItems(): Promise<
  GalleryItemRow[]
> {
  return getCachedJson({
    key: PUBLIC_CACHE_KEYS.gallery,
    load: getSerializedGalleryItems,
    schema: z.array(galleryItemRowSchema),
    ttlSeconds: PUBLIC_CACHE_TTL_SECONDS,
  });
}

function gallerySelect() {
  return db.select({
    id: galleryItems.id,
    title: galleryItems.title,
    caption: galleryItems.caption,
    type: galleryItems.type,
    imageId: storageObjects.id,
    imagePublicUrl: storageObjects.publicUrl,
    imageObjectKey: storageObjects.objectKey,
    imageOriginalFilename: storageObjects.originalFilename,
    imageMimeType: storageObjects.mimeType,
    imageByteSize: storageObjects.byteSize,
    isFeatured: galleryItems.isFeatured,
    capturedAt: galleryItems.capturedAt,
    creatorId: user.id,
    creatorName: user.name,
    creatorEmail: user.email,
    createdAt: galleryItems.createdAt,
    updatedAt: galleryItems.updatedAt,
  });
}

function mapGalleryRow(row: GalleryQueryRow): GalleryListItem {
  return {
    id: row.id,
    title: row.title,
    caption: row.caption,
    type: row.type,
    image: {
      id: row.imageId,
      publicUrl: row.imagePublicUrl,
      objectKey: row.imageObjectKey,
      originalFilename: row.imageOriginalFilename,
      mimeType: row.imageMimeType,
      byteSize: row.imageByteSize,
    },
    isFeatured: row.isFeatured,
    capturedAt: row.capturedAt,
    creator:
      row.creatorId && row.creatorName && row.creatorEmail
        ? {
            id: row.creatorId,
            name: row.creatorName,
            email: row.creatorEmail,
          }
        : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function getGalleryWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const typeFilters = getValidTypeFilters(getDataTableFilterValues(query, "type"));
  const featuredFilters = getDataTableFilterValues(query, "featuredStatus");

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(
      ilike(galleryItems.title, pattern),
      ilike(galleryItems.caption, pattern),
      ilike(storageObjects.originalFilename, pattern),
      ilike(user.name, pattern),
      ilike(user.email, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (typeFilters.length > 0) {
    conditions.push(inArray(galleryItems.type, typeFilters));
  }

  if (featuredFilters.length === 1) {
    const featuredFilter = featuredFilters[0];
    if (featuredFilter === "featured") {
      conditions.push(eq(galleryItems.isFeatured, true));
    } else if (featuredFilter === "not_featured") {
      conditions.push(eq(galleryItems.isFeatured, false));
    }
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getGalleryOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "title":
      return isAscending
        ? [asc(galleryItems.title), desc(galleryItems.id)]
        : [desc(galleryItems.title), desc(galleryItems.id)];
    case "type":
      return isAscending
        ? [asc(galleryItems.type), desc(galleryItems.id)]
        : [desc(galleryItems.type), desc(galleryItems.id)];
    case "file":
      return isAscending
        ? [asc(storageObjects.originalFilename), desc(galleryItems.id)]
        : [desc(storageObjects.originalFilename), desc(galleryItems.id)];
    case "capturedAt":
      return isAscending
        ? [asc(galleryItems.capturedAt), asc(galleryItems.id)]
        : [desc(galleryItems.capturedAt), desc(galleryItems.id)];
    default:
      return isAscending
        ? [asc(galleryItems.updatedAt), asc(galleryItems.id)]
        : [desc(galleryItems.updatedAt), desc(galleryItems.id)];
  }
}

function getValidTypeFilters(values: string[]): GalleryItemRow["type"][] {
  return values.flatMap((value) => {
    const parsedValue = galleryItemTypeSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}
