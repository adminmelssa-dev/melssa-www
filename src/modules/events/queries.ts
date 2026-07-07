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
  eventRowSchema,
  type EventRow,
} from "@/modules/events/contracts";
import { eventStatusSchema } from "@/modules/content/contracts";
import {
  createDataTablePage,
  getDataTableFilterValues,
  getDataTableOffset,
  type DataTablePage,
  type DataTableQuery,
} from "@/lib/data-table-query";
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

export interface EventsAdminStats {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  cancelledEvents: number;
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

export async function getSerializedEventPage(
  query: DataTableQuery,
): Promise<DataTablePage<EventRow>> {
  const where = getEventWhere(query);
  const [totalRow] = await db
    .select({ value: count() })
    .from(events)
    .leftJoin(user, eq(user.id, events.createdById))
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, events.posterStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .where(where);
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
    .where(where)
    .orderBy(...getEventOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));

  return createDataTablePage({
    items: rows.map(mapEventRow).map((event) => serializeEvent(event)),
    query,
    totalRows: totalRow?.value ?? 0,
  });
}

export async function getEventsAdminStats(): Promise<EventsAdminStats> {
  const [totalEvents, publishedEvents, draftEvents, cancelledEvents] =
    await Promise.all([
      db.$count(events),
      db.$count(events, eq(events.status, "published")),
      db.$count(events, eq(events.status, "draft")),
      db.$count(events, eq(events.status, "cancelled")),
    ]);

  return {
    cancelledEvents,
    draftEvents,
    publishedEvents,
    totalEvents,
  };
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

function getEventWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const statusFilters = getValidStatusFilters(
    getDataTableFilterValues(query, "status"),
  );
  const posterFilters = getDataTableFilterValues(query, "posterStatus");

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(
      ilike(events.title, pattern),
      ilike(events.description, pattern),
      ilike(events.location, pattern),
      ilike(storageObjects.originalFilename, pattern),
      ilike(user.name, pattern),
      ilike(user.email, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (statusFilters.length > 0) {
    conditions.push(inArray(events.status, statusFilters));
  }

  if (posterFilters.length === 1) {
    const posterFilter = posterFilters[0];
    if (posterFilter === "has_poster") {
      conditions.push(isNotNull(storageObjects.id));
    } else if (posterFilter === "no_poster") {
      conditions.push(isNull(storageObjects.id));
    }
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getEventOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "title":
      return isAscending
        ? [asc(events.title), desc(events.id)]
        : [desc(events.title), desc(events.id)];
    case "startsAt":
      return isAscending
        ? [asc(events.startsAt), asc(events.id)]
        : [desc(events.startsAt), desc(events.id)];
    case "endsAt":
      return isAscending
        ? [asc(events.endsAt), asc(events.id)]
        : [desc(events.endsAt), desc(events.id)];
    case "location":
      return isAscending
        ? [asc(events.location), desc(events.id)]
        : [desc(events.location), desc(events.id)];
    case "status":
      return isAscending
        ? [asc(events.status), desc(events.id)]
        : [desc(events.status), desc(events.id)];
    case "poster":
      return isAscending
        ? [asc(storageObjects.originalFilename), desc(events.id)]
        : [desc(storageObjects.originalFilename), desc(events.id)];
    default:
      return isAscending
        ? [asc(events.updatedAt), asc(events.id)]
        : [desc(events.updatedAt), desc(events.id)];
  }
}

function getValidStatusFilters(values: string[]): EventRow["status"][] {
  return values.flatMap((value) => {
    const parsedValue = eventStatusSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}
