import "server-only";

import {
  and,
  desc,
  eq,
} from "drizzle-orm";
import type { SpotlightRow } from "@/modules/spotlights/contracts";
import { db } from "@/server/db";
import {
  storageObjects,
  studentSpotlights,
  user,
} from "@/server/db/schema";

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

export async function getSerializedPublishedSpotlights(): Promise<
  SpotlightRow[]
> {
  const spotlights = await getPublishedSpotlights();
  return spotlights.map((spotlight) => serializeSpotlight(spotlight));
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
