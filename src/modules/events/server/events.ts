import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type {
  CreateEventInput,
  DeleteEventInput,
  UpdateEventInput,
} from "@/modules/events/contracts";
import { getNextEventPublishedAt } from "@/modules/content/contracts";
import { ExpectedError } from "@/lib/action-result";
import { writeAuditLog } from "@/server/audit/log";
import { db } from "@/server/db";
import {
  events,
  storageObjects,
} from "@/server/db/schema";
import { invalidateCacheKeys, PUBLIC_CACHE_KEYS } from "@/server/cache";
import { notifyEventPublished } from "@/server/notifications";
import { deleteStoredObjectById } from "@/server/storage/objects";

export async function createEvent({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: CreateEventInput;
}): Promise<void> {
  await ensureEventPosterUsable(input.posterStorageObjectId);

  const [createdEvent] = await db
    .insert(events)
    .values({
      title: input.title,
      description: input.description,
      startsAt: new Date(input.startsAt),
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      location: input.location,
      status: input.status,
      createdById: actorUserId,
      posterStorageObjectId: input.posterStorageObjectId,
      publishedAt: input.status === "published" ? new Date() : null,
    })
    .returning({
      id: events.id,
      title: events.title,
    });

  if (!createdEvent) {
    throw new Error("Event could not be created.");
  }

  await writeAuditLog({
    actorUserId,
    action: "event.create",
    entityType: "event",
    entityId: createdEvent.id,
    summary: `Created event ${createdEvent.title}.`,
    metadata: {
      title: createdEvent.title,
      status: input.status,
      startsAt: input.startsAt,
      hasPoster: input.posterStorageObjectId !== null,
    },
  });

  if (input.status === "published") {
    await notifyEventPublished({
      title: createdEvent.title,
      startsAt: input.startsAt,
      location: input.location,
    });
  }

  await revalidateEvents();
}

export async function updateEvent({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateEventInput;
}): Promise<void> {
  const existingEvent = await getEventForMutation(input.eventId);
  await ensureEventPosterUsable(input.posterStorageObjectId, input.eventId);
  const nextPublishedAt = getNextEventPublishedAt({
    currentPublishedAt: existingEvent.publishedAt,
    nextStatus: input.status,
    previousStatus: existingEvent.status,
  });
  const shouldNotifyPublished =
    existingEvent.status !== "published" && input.status === "published";

  await db
    .update(events)
    .set({
      title: input.title,
      description: input.description,
      startsAt: new Date(input.startsAt),
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      location: input.location,
      status: input.status,
      posterStorageObjectId: input.posterStorageObjectId,
      publishedAt: nextPublishedAt,
      updatedAt: new Date(),
    })
    .where(eq(events.id, input.eventId));

  if (
    existingEvent.posterStorageObjectId &&
    existingEvent.posterStorageObjectId !== input.posterStorageObjectId
  ) {
    await deleteStoredObjectById(existingEvent.posterStorageObjectId);
  }

  await writeAuditLog({
    actorUserId,
    action: "event.update",
    entityType: "event",
    entityId: input.eventId,
    summary: `Updated event ${input.title}.`,
    metadata: {
      previousTitle: existingEvent.title,
      nextTitle: input.title,
      previousStatus: existingEvent.status,
      nextStatus: input.status,
      startsAt: input.startsAt,
    },
  });

  if (shouldNotifyPublished) {
    await notifyEventPublished({
      title: input.title,
      startsAt: input.startsAt,
      location: input.location,
    });
  }

  await revalidateEvents();
}

export async function deleteEvent({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: DeleteEventInput;
}): Promise<void> {
  const existingEvent = await getEventForMutation(input.eventId);

  await db.delete(events).where(eq(events.id, input.eventId));

  if (existingEvent.posterStorageObjectId) {
    await deleteStoredObjectById(existingEvent.posterStorageObjectId);
  }

  await writeAuditLog({
    actorUserId,
    action: "event.delete",
    entityType: "event",
    entityId: input.eventId,
    summary: `Deleted event ${existingEvent.title}.`,
    metadata: {
      title: existingEvent.title,
      status: existingEvent.status,
    },
  });

  await revalidateEvents();
}

async function ensureEventPosterUsable(
  posterStorageObjectId: string | null,
  ignoredEventId?: number,
): Promise<void> {
  if (!posterStorageObjectId) return;

  const [object] = await db
    .select({
      id: storageObjects.id,
      endpoint: storageObjects.endpoint,
      status: storageObjects.status,
    })
    .from(storageObjects)
    .where(eq(storageObjects.id, posterStorageObjectId))
    .limit(1);

  if (!object) {
    throw new ExpectedError("Uploaded event poster was not found.");
  }

  if (object.endpoint !== "eventPoster" || object.status !== "completed") {
    throw new ExpectedError("Uploaded file is not a completed event poster.");
  }

  const [existingEvent] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.posterStorageObjectId, posterStorageObjectId))
    .limit(1);

  if (existingEvent && existingEvent.id !== ignoredEventId) {
    throw new ExpectedError("This poster is already in use.");
  }
}

async function getEventForMutation(eventId: number) {
  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      status: events.status,
      posterStorageObjectId: events.posterStorageObjectId,
      publishedAt: events.publishedAt,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    throw new ExpectedError("Event not found.");
  }

  return event;
}

async function revalidateEvents(): Promise<void> {
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
  await invalidateCacheKeys([PUBLIC_CACHE_KEYS.events]);
}
