import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type {
  CreateCourseInput,
  DeleteCourseInput,
  UpdateCourseInput,
} from "@/modules/academics/contracts";
import { ExpectedError } from "@/lib/action-result";
import { writeAuditLog } from "@/server/audit/log";
import { db } from "@/server/db";
import {
  courses,
  lecturerCourses,
  resources,
} from "@/server/db/schema";

export async function createCourse({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: CreateCourseInput;
}): Promise<void> {
  await ensureCourseCodeAvailable(input.code);

  const [createdCourse] = await db
    .insert(courses)
    .values({
      code: input.code,
      title: input.title,
      level: input.level,
      semester: input.semester,
      description: input.description,
    })
    .returning({
      id: courses.id,
      code: courses.code,
      title: courses.title,
    });

  if (!createdCourse) {
    throw new Error("Course could not be created.");
  }

  await writeAuditLog({
    actorUserId,
    action: "course.create",
    entityType: "course",
    entityId: createdCourse.id,
    summary: `Created course ${createdCourse.code}: ${createdCourse.title}.`,
    metadata: {
      code: createdCourse.code,
      title: createdCourse.title,
      level: input.level,
      semester: input.semester,
    },
  });

  revalidateCourses();
}

export async function updateCourse({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateCourseInput;
}): Promise<void> {
  const existingCourse = await getCourseForMutation(input.courseId);
  await ensureCourseCodeAvailable(input.code, input.courseId);

  await db
    .update(courses)
    .set({
      code: input.code,
      title: input.title,
      level: input.level,
      semester: input.semester,
      description: input.description,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, input.courseId));

  await writeAuditLog({
    actorUserId,
    action: "course.update",
    entityType: "course",
    entityId: input.courseId,
    summary: `Updated course ${input.code}: ${input.title}.`,
    metadata: {
      previousCode: existingCourse.code,
      nextCode: input.code,
      previousTitle: existingCourse.title,
      nextTitle: input.title,
      previousLevel: existingCourse.level,
      nextLevel: input.level,
      previousSemester: existingCourse.semester,
      nextSemester: input.semester,
    },
  });

  revalidateCourses();
}

export async function deleteCourse({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: DeleteCourseInput;
}): Promise<void> {
  const existingCourse = await getCourseForMutation(input.courseId);
  const usage = await getCourseUsage(input.courseId);

  if (usage.resourceCount > 0 || usage.lecturerCount > 0) {
    throw new ExpectedError(
      "Remove resources and lecturer assignments before deleting this course.",
    );
  }

  await db.delete(courses).where(eq(courses.id, input.courseId));

  await writeAuditLog({
    actorUserId,
    action: "course.delete",
    entityType: "course",
    entityId: input.courseId,
    summary: `Deleted course ${existingCourse.code}: ${existingCourse.title}.`,
    metadata: {
      code: existingCourse.code,
      title: existingCourse.title,
      level: existingCourse.level,
      semester: existingCourse.semester,
    },
  });

  revalidateCourses();
}

async function ensureCourseCodeAvailable(
  code: string,
  ignoredCourseId?: number,
): Promise<void> {
  const [existingCourse] = await db
    .select({
      id: courses.id,
    })
    .from(courses)
    .where(eq(courses.code, code))
    .limit(1);

  if (existingCourse && existingCourse.id !== ignoredCourseId) {
    throw new ExpectedError("A course with this code already exists.");
  }
}

async function getCourseForMutation(courseId: number) {
  const [course] = await db
    .select({
      id: courses.id,
      code: courses.code,
      title: courses.title,
      level: courses.level,
      semester: courses.semester,
    })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    throw new ExpectedError("Course not found.");
  }

  return course;
}

async function getCourseUsage(courseId: number): Promise<{
  resourceCount: number;
  lecturerCount: number;
}> {
  const [resourceCount, lecturerCount] = await Promise.all([
    db.$count(resources, eq(resources.courseId, courseId)),
    db.$count(lecturerCourses, eq(lecturerCourses.courseId, courseId)),
  ]);

  return { resourceCount, lecturerCount };
}

function revalidateCourses(): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard/resources");
}
