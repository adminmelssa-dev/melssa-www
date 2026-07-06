import "server-only";

import {
  and,
  asc,
  desc,
  eq,
} from "drizzle-orm";
import { z } from "zod";
import {
  eventRowSchema,
  type EventRow,
} from "@/modules/events/contracts";
import { db } from "@/server/db";
import {
  events,
  storageObjects,
  user,
} from "@/server/db/schema";
import {
  getCachedJson,
  PUBLIC_CACHE_KEYS,
  PUBLIC_CACHE_TTL_SECONDS,
} from "@/server/cache";

interface EventListItem {
  id: number;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  status: EventRow["status"];
  author: EventRow["author"];
  poster: EventRow["poster"];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EventQueryRow {
  id: number;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  status: EventRow["status"];
  authorId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  posterId: string | null;
  posterPublicUrl: string | null;
  posterObjectKey: string | null;
  posterOriginalFilename: string | null;
  posterMimeType: string | null;
  posterByteSize: number | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getEvents(): Promise<EventListItem[]> {
  const rows = await eventSelect()
    .from(events)
    .leftJoin(user, eq(user.id, events.createdById))
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, events.posterStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .orderBy(desc(events.startsAt), desc(events.createdAt));

  return rows.map(mapEventRow);
}

export async function getPublishedEvents(): Promise<EventListItem[]> {
  const rows = await eventSelect()
    .from(events)
    .leftJoin(user, eq(user.id, events.createdById))
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, events.posterStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .where(eq(events.status, "published"))
    .orderBy(asc(events.startsAt), desc(events.createdAt));

  return rows.map(mapEventRow);
}

export function serializeEvent(item: EventListItem): EventRow {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    startsAt: item.startsAt.toISOString(),
    endsAt: item.endsAt?.toISOString() ?? null,
    location: item.location,
    status: item.status,
    author: item.author,
    poster: item.poster,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getSerializedEvents(): Promise<EventRow[]> {
  const eventRows = await getEvents();
  return eventRows.map((item) => serializeEvent(item));
}

export async function getSerializedPublishedEvents(): Promise<EventRow[]> {
  return getCachedJson({
    key: PUBLIC_CACHE_KEYS.events,
    load: async () => {
      const eventRows = await getPublishedEvents();
      return eventRows.map((item) => serializeEvent(item));
    },
    schema: z.array(eventRowSchema),
    ttlSeconds: PUBLIC_CACHE_TTL_SECONDS,
  });
}

function eventSelect() {
  return db.select({
    id: events.id,
    title: events.title,
    description: events.description,
    startsAt: events.startsAt,
    endsAt: events.endsAt,
    location: events.location,
    status: events.status,
    authorId: user.id,
    authorName: user.name,
    authorEmail: user.email,
    posterId: storageObjects.id,
    posterPublicUrl: storageObjects.publicUrl,
    posterObjectKey: storageObjects.objectKey,
    posterOriginalFilename: storageObjects.originalFilename,
    posterMimeType: storageObjects.mimeType,
    posterByteSize: storageObjects.byteSize,
    publishedAt: events.publishedAt,
    createdAt: events.createdAt,
    updatedAt: events.updatedAt,
  });
}

function mapEventRow(row: EventQueryRow): EventListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    location: row.location,
    status: row.status,
    author:
      row.authorId && row.authorName && row.authorEmail
        ? {
            id: row.authorId,
            name: row.authorName,
            email: row.authorEmail,
          }
        : null,
    poster:
      row.posterId &&
      row.posterPublicUrl &&
      row.posterObjectKey &&
      row.posterOriginalFilename &&
      row.posterMimeType &&
      row.posterByteSize !== null
        ? {
            id: row.posterId,
            publicUrl: row.posterPublicUrl,
            objectKey: row.posterObjectKey,
            originalFilename: row.posterOriginalFilename,
            mimeType: row.posterMimeType,
            byteSize: row.posterByteSize,
          }
        : null,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
