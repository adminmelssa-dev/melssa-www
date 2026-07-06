import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type {
  CreateResourceInput,
  DeleteResourceInput,
  UpdateResourceInput,
} from "@/modules/resources/contracts";
import {
  RESOURCE_TYPE_LABELS,
} from "@/modules/resources/contracts";
import { getNextContentPublishedAt } from "@/modules/content/contracts";
import { ExpectedError } from "@/lib/action-result";
import { writeAuditLog } from "@/server/audit/log";
import { db } from "@/server/db";
import {
  courses,
  resources,
  storageObjects,
} from "@/server/db/schema";
import { notifyResourcePublished } from "@/server/notifications";
import { deleteStoredObjectById } from "@/server/storage/objects";

export async function createResource({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: CreateResourceInput;
}): Promise<void> {
  await ensureCourseExists(input.courseId);
  await ensureResourceFileUsable(input.storageObjectId);

  const [createdResource] = await db
    .insert(resources)
    .values({
      title: input.title,
      description: input.description,
      type: input.type,
      level: input.level,
      semester: input.semester,
      academicYear: input.academicYear,
      courseId: input.courseId,
      storageObjectId: input.storageObjectId,
      status: input.status,
      uploadedByUserId: actorUserId,
      publishedAt: input.status === "published" ? new Date() : null,
    })
    .returning({
      id: resources.id,
      title: resources.title,
    });

  if (!createdResource) {
    throw new Error("Resource could not be created.");
  }

  await writeAuditLog({
    actorUserId,
    action: "resource.create",
    entityType: "resource",
    entityId: createdResource.id,
    summary: `Created ${RESOURCE_TYPE_LABELS[input.type].toLowerCase()} ${createdResource.title}.`,
    metadata: {
      title: createdResource.title,
      type: input.type,
      status: input.status,
      level: input.level,
      semester: input.semester,
      courseId: input.courseId,
    },
  });

  if (input.status === "published") {
    await notifyResourcePublished({
      title: createdResource.title,
      type: input.type,
      level: input.level,
      semester: input.semester,
    });
  }

  revalidateResources();
}

export async function updateResource({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateResourceInput;
}): Promise<void> {
  const existingResource = await getResourceForMutation(input.resourceId);
  await ensureCourseExists(input.courseId);
  const nextPublishedAt = getNextContentPublishedAt({
    currentPublishedAt: existingResource.publishedAt,
    nextStatus: input.status,
    previousStatus: existingResource.status,
  });
  const shouldNotifyPublished =
    existingResource.status !== "published" && input.status === "published";

  await db
    .update(resources)
    .set({
      title: input.title,
      description: input.description,
      type: input.type,
      level: input.level,
      semester: input.semester,
      academicYear: input.academicYear,
      courseId: input.courseId,
      status: input.status,
      publishedAt: nextPublishedAt,
      updatedAt: new Date(),
    })
    .where(eq(resources.id, input.resourceId));

  await writeAuditLog({
    actorUserId,
    action: "resource.update",
    entityType: "resource",
    entityId: input.resourceId,
    summary: `Updated resource ${input.title}.`,
    metadata: {
      previousTitle: existingResource.title,
      nextTitle: input.title,
      previousStatus: existingResource.status,
      nextStatus: input.status,
      previousType: existingResource.type,
      nextType: input.type,
    },
  });

  if (shouldNotifyPublished) {
    await notifyResourcePublished({
      title: input.title,
      type: input.type,
      level: input.level,
      semester: input.semester,
    });
  }

  revalidateResources();
}

export async function deleteResource({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: DeleteResourceInput;
}): Promise<void> {
  const existingResource = await getResourceForMutation(input.resourceId);

  await db.delete(resources).where(eq(resources.id, input.resourceId));
  await deleteStoredObjectById(existingResource.storageObjectId);

  await writeAuditLog({
    actorUserId,
    action: "resource.delete",
    entityType: "resource",
    entityId: input.resourceId,
    summary: `Deleted resource ${existingResource.title}.`,
    metadata: {
      title: existingResource.title,
      type: existingResource.type,
      status: existingResource.status,
      storageObjectId: existingResource.storageObjectId,
    },
  });

  revalidateResources();
}

async function ensureCourseExists(courseId: number | null): Promise<void> {
  if (courseId === null) return;

  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    throw new ExpectedError("Selected course no longer exists.");
  }
}

async function ensureResourceFileUsable(storageObjectId: string): Promise<void> {
  const [object] = await db
    .select({
      id: storageObjects.id,
      endpoint: storageObjects.endpoint,
      status: storageObjects.status,
    })
    .from(storageObjects)
    .where(eq(storageObjects.id, storageObjectId))
    .limit(1);

  if (!object) {
    throw new ExpectedError("Uploaded resource file was not found.");
  }

  if (object.endpoint !== "resourceFile" || object.status !== "completed") {
    throw new ExpectedError("Uploaded file is not a completed resource file.");
  }

  const [existingResource] = await db
    .select({ id: resources.id })
    .from(resources)
    .where(eq(resources.storageObjectId, storageObjectId))
    .limit(1);

  if (existingResource) {
    throw new ExpectedError("This uploaded file is already attached to a resource.");
  }
}

async function getResourceForMutation(resourceId: number) {
  const [resource] = await db
    .select({
      id: resources.id,
      title: resources.title,
      type: resources.type,
      status: resources.status,
      storageObjectId: resources.storageObjectId,
      publishedAt: resources.publishedAt,
    })
    .from(resources)
    .where(eq(resources.id, resourceId))
    .limit(1);

  if (!resource) {
    throw new ExpectedError("Resource not found.");
  }

  return resource;
}

function revalidateResources(): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/resources");
}
