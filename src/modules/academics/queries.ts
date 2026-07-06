import "server-only";

import {
  asc,
  countDistinct,
  eq,
} from "drizzle-orm";
import type {
  AcademicLevel,
  CourseRow,
  SemesterTerm,
} from "@/modules/academics/contracts";
import { db } from "@/server/db";
import {
  courses,
  lecturerCourses,
  resources,
} from "@/server/db/schema";

export interface CourseListItem {
  id: number;
  code: string;
  title: string;
  level: AcademicLevel;
  semester: SemesterTerm;
  description: string | null;
  resourceCount: number;
  lecturerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getCourses(): Promise<CourseListItem[]> {
  return db
    .select({
      id: courses.id,
      code: courses.code,
      title: courses.title,
      level: courses.level,
      semester: courses.semester,
      description: courses.description,
      resourceCount: countDistinct(resources.id),
      lecturerCount: countDistinct(lecturerCourses.lecturerId),
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
    })
    .from(courses)
    .leftJoin(resources, eq(resources.courseId, courses.id))
    .leftJoin(lecturerCourses, eq(lecturerCourses.courseId, courses.id))
    .groupBy(
      courses.id,
      courses.code,
      courses.title,
      courses.level,
      courses.semester,
      courses.description,
      courses.createdAt,
      courses.updatedAt,
    )
    .orderBy(
      asc(courses.level),
      asc(courses.semester),
      asc(courses.code),
    );
}

export function serializeCourse(item: CourseListItem): CourseRow {
  return {
    id: item.id,
    code: item.code,
    title: item.title,
    level: item.level,
    semester: item.semester,
    description: item.description,
    resourceCount: item.resourceCount,
    lecturerCount: item.lecturerCount,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getSerializedCourses(): Promise<CourseRow[]> {
  const courseRows = await getCourses();
  return courseRows.map((item) => serializeCourse(item));
}
