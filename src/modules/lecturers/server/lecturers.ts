import "server-only";

import { revalidatePath } from "next/cache";
import {
  eq,
  inArray,
} from "drizzle-orm";
import type {
  CreateLecturerInput,
  DeleteLecturerInput,
  UpdateLecturerInput,
} from "@/modules/lecturers/contracts";
import { ExpectedError } from "@/lib/action-result";
import { writeAuditLog } from "@/server/audit/log";
import { db } from "@/server/db";
import {
  courses,
  lecturerCourses,
  lecturers,
  storageObjects,
} from "@/server/db/schema";
import { invalidateCacheKeys, PUBLIC_CACHE_KEYS } from "@/server/cache";
import { deleteStoredObjectById } from "@/server/storage/objects";

export async function createLecturer({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: CreateLecturerInput;
}): Promise<void> {
  await ensureLecturerPhotoUsable(input.photoStorageObjectId);
  const courseIds = await resolveCourseIds(input.courseIds);

  const [createdLecturer] = await db
    .insert(lecturers)
    .values({
      name: input.name,
      title: input.title,
      email: input.email,
      phone: input.phone,
      officeLocation: input.officeLocation,
      officeHours: input.officeHours,
      photoStorageObjectId: input.photoStorageObjectId,
    })
    .returning({
      id: lecturers.id,
      name: lecturers.name,
    });

  if (!createdLecturer) {
    throw new Error("Lecturer could not be created.");
  }

  await replaceLecturerCourses(createdLecturer.id, courseIds);

  await writeAuditLog({
    actorUserId,
    action: "lecturer.create",
    entityType: "lecturer",
    entityId: createdLecturer.id,
    summary: `Created lecturer profile for ${createdLecturer.name}.`,
    metadata: {
      name: createdLecturer.name,
      courseCount: courseIds.length,
      hasPhoto: input.photoStorageObjectId !== null,
    },
  });

  await revalidateLecturers();
}

export async function updateLecturer({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateLecturerInput;
}): Promise<void> {
  const existingLecturer = await getLecturerForMutation(input.lecturerId);
  await ensureLecturerPhotoUsable(input.photoStorageObjectId, input.lecturerId);
  const courseIds = await resolveCourseIds(input.courseIds);

  await db
    .update(lecturers)
    .set({
      name: input.name,
      title: input.title,
      email: input.email,
      phone: input.phone,
      officeLocation: input.officeLocation,
      officeHours: input.officeHours,
      photoStorageObjectId: input.photoStorageObjectId,
      updatedAt: new Date(),
    })
    .where(eq(lecturers.id, input.lecturerId));

  await replaceLecturerCourses(input.lecturerId, courseIds);

  if (
    existingLecturer.photoStorageObjectId &&
    existingLecturer.photoStorageObjectId !== input.photoStorageObjectId
  ) {
    await deleteStoredObjectById(existingLecturer.photoStorageObjectId);
  }

  await writeAuditLog({
    actorUserId,
    action: "lecturer.update",
    entityType: "lecturer",
    entityId: input.lecturerId,
    summary: `Updated lecturer profile for ${input.name}.`,
    metadata: {
      previousName: existingLecturer.name,
      nextName: input.name,
      previousEmail: existingLecturer.email,
      nextEmail: input.email,
      courseCount: courseIds.length,
      hasPhoto: input.photoStorageObjectId !== null,
    },
  });

  await revalidateLecturers();
}

export async function deleteLecturer({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: DeleteLecturerInput;
}): Promise<void> {
  const existingLecturer = await getLecturerForMutation(input.lecturerId);

  await db.delete(lecturers).where(eq(lecturers.id, input.lecturerId));

  if (existingLecturer.photoStorageObjectId) {
    await deleteStoredObjectById(existingLecturer.photoStorageObjectId);
  }

  await writeAuditLog({
    actorUserId,
    action: "lecturer.delete",
    entityType: "lecturer",
    entityId: input.lecturerId,
    summary: `Deleted lecturer profile for ${existingLecturer.name}.`,
    metadata: {
      name: existingLecturer.name,
      email: existingLecturer.email,
    },
  });

  await revalidateLecturers();
}

async function replaceLecturerCourses(
  lecturerId: number,
  courseIds: number[],
): Promise<void> {
  await db
    .delete(lecturerCourses)
    .where(eq(lecturerCourses.lecturerId, lecturerId));

  if (courseIds.length === 0) return;

  await db.insert(lecturerCourses).values(
    courseIds.map((courseId) => ({
      lecturerId,
      courseId,
    })),
  );
}

async function resolveCourseIds(courseIds: number[]): Promise<number[]> {
  const uniqueCourseIds = Array.from(new Set(courseIds));
  if (uniqueCourseIds.length === 0) return [];

  const existingCourses = await db
    .select({ id: courses.id })
    .from(courses)
    .where(inArray(courses.id, uniqueCourseIds));
  const existingCourseIds = new Set(existingCourses.map((course) => course.id));
  const missingCourseId = uniqueCourseIds.find(
    (courseId) => !existingCourseIds.has(courseId),
  );

  if (missingCourseId) {
    throw new ExpectedError("One or more selected courses no longer exist.");
  }

  return uniqueCourseIds;
}

async function ensureLecturerPhotoUsable(
  photoStorageObjectId: string | null,
  ignoredLecturerId?: number,
): Promise<void> {
  if (!photoStorageObjectId) return;

  const [photoObject] = await db
    .select({
      id: storageObjects.id,
      endpoint: storageObjects.endpoint,
      status: storageObjects.status,
    })
    .from(storageObjects)
    .where(eq(storageObjects.id, photoStorageObjectId))
    .limit(1);

  if (!photoObject) {
    throw new ExpectedError("Uploaded lecturer photo was not found.");
  }

  if (
    photoObject.endpoint !== "lecturerPhoto" ||
    photoObject.status !== "completed"
  ) {
    throw new ExpectedError("Uploaded file is not a completed lecturer photo.");
  }

  const [existingLecturer] = await db
    .select({ id: lecturers.id })
    .from(lecturers)
    .where(eq(lecturers.photoStorageObjectId, photoStorageObjectId))
    .limit(1);

  if (existingLecturer && existingLecturer.id !== ignoredLecturerId) {
    throw new ExpectedError("This lecturer photo is already in use.");
  }
}

async function getLecturerForMutation(lecturerId: number) {
  const [lecturer] = await db
    .select({
      id: lecturers.id,
      name: lecturers.name,
      email: lecturers.email,
      photoStorageObjectId: lecturers.photoStorageObjectId,
    })
    .from(lecturers)
    .where(eq(lecturers.id, lecturerId))
    .limit(1);

  if (!lecturer) {
    throw new ExpectedError("Lecturer not found.");
  }

  return lecturer;
}

async function revalidateLecturers(): Promise<void> {
  revalidatePath("/lecturers");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/lecturers");
  await invalidateCacheKeys([PUBLIC_CACHE_KEYS.lecturers]);
}
