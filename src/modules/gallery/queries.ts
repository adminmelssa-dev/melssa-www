import "server-only";

import {
  and,
  desc,
  eq,
} from "drizzle-orm";
import { z } from "zod";
import {
  galleryItemRowSchema,
  type GalleryItemRow,
} from "@/modules/gallery/contracts";
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
