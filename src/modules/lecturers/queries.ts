import "server-only";

import {
  and,
  asc,
  eq,
} from "drizzle-orm";
import type {
  LecturerCourse,
  LecturerPhoto,
  LecturerRow,
} from "@/modules/lecturers/contracts";
import { db } from "@/server/db";
import {
  courses,
  lecturerCourses,
  lecturers,
  storageObjects,
} from "@/server/db/schema";

interface LecturerListItem {
  id: number;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  officeLocation: string | null;
  officeHours: string | null;
  photo: LecturerPhoto | null;
  courses: LecturerCourse[];
  createdAt: Date;
  updatedAt: Date;
}

export async function getLecturers(): Promise<LecturerListItem[]> {
  const lecturerRows = await db
    .select({
      id: lecturers.id,
      name: lecturers.name,
      title: lecturers.title,
      email: lecturers.email,
      phone: lecturers.phone,
      officeLocation: lecturers.officeLocation,
      officeHours: lecturers.officeHours,
      photoStorageObjectId: storageObjects.id,
      photoPublicUrl: storageObjects.publicUrl,
      photoObjectKey: storageObjects.objectKey,
      photoOriginalFilename: storageObjects.originalFilename,
      createdAt: lecturers.createdAt,
      updatedAt: lecturers.updatedAt,
    })
    .from(lecturers)
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, lecturers.photoStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .orderBy(asc(lecturers.name));

  const assignmentRows = await db
    .select({
      lecturerId: lecturerCourses.lecturerId,
      courseId: courses.id,
      courseCode: courses.code,
      courseTitle: courses.title,
    })
    .from(lecturerCourses)
    .innerJoin(courses, eq(courses.id, lecturerCourses.courseId))
    .orderBy(asc(courses.code));

  const coursesByLecturerId = new Map<number, LecturerCourse[]>();

  for (const row of assignmentRows) {
    const existingCourses = coursesByLecturerId.get(row.lecturerId);
    const lecturerCourse = {
      id: row.courseId,
      code: row.courseCode,
      title: row.courseTitle,
    };

    if (existingCourses) {
      existingCourses.push(lecturerCourse);
    } else {
      coursesByLecturerId.set(row.lecturerId, [lecturerCourse]);
    }
  }

  return lecturerRows.map((row) => ({
    id: row.id,
    name: row.name,
    title: row.title,
    email: row.email,
    phone: row.phone,
    officeLocation: row.officeLocation,
    officeHours: row.officeHours,
    photo:
      row.photoStorageObjectId &&
      row.photoPublicUrl &&
      row.photoObjectKey &&
      row.photoOriginalFilename
        ? {
            id: row.photoStorageObjectId,
            publicUrl: row.photoPublicUrl,
            objectKey: row.photoObjectKey,
            originalFilename: row.photoOriginalFilename,
          }
        : null,
    courses: coursesByLecturerId.get(row.id) ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export function serializeLecturer(item: LecturerListItem): LecturerRow {
  return {
    id: item.id,
    name: item.name,
    title: item.title,
    email: item.email,
    phone: item.phone,
    officeLocation: item.officeLocation,
    officeHours: item.officeHours,
    photo: item.photo,
    courses: item.courses,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getSerializedLecturers(): Promise<LecturerRow[]> {
  const lecturerRows = await getLecturers();
  return lecturerRows.map((item) => serializeLecturer(item));
}
