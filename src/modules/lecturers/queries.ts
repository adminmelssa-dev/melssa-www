import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import type {
  LecturerCourse,
  LecturerPhoto,
  LecturerRow,
} from "@/modules/lecturers/contracts";
import { lecturerRowSchema } from "@/modules/lecturers/contracts";
import {
  createDataTablePage,
  getDataTableFilterValues,
  getDataTableOffset,
  type DataTablePage,
  type DataTableQuery,
} from "@/lib/data-table-query";
import { db } from "@/server/db";
import {
  courses,
  lecturerCourses,
  lecturers,
  storageObjects,
} from "@/server/db/schema";
import {
  getCachedJson,
  PUBLIC_CACHE_KEYS,
  PUBLIC_CACHE_TTL_SECONDS,
} from "@/server/cache";

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

export interface LecturersAdminStats {
  totalLecturers: number;
  withEmail: number;
  withPhoto: number;
  courseAssignments: number;
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

export async function getSerializedLecturerPage(
  query: DataTableQuery,
): Promise<DataTablePage<LecturerRow>> {
  const where = getLecturerWhere(query);
  const [totalRow] = await db
    .select({ value: count() })
    .from(lecturers)
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, lecturers.photoStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .where(where);
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
    .where(where)
    .orderBy(...getLecturerOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));

  const coursesByLecturerId = await getCoursesByLecturerId(
    lecturerRows.map((row) => row.id),
  );

  return createDataTablePage({
    items: lecturerRows
      .map((row) => mapLecturerRow(row, coursesByLecturerId))
      .map((item) => serializeLecturer(item)),
    query,
    totalRows: totalRow?.value ?? 0,
  });
}

export async function getLecturersAdminStats(): Promise<LecturersAdminStats> {
  const [totalLecturers, withEmail, photoRows, courseAssignments] =
    await Promise.all([
      db.$count(lecturers),
      db.$count(lecturers, isNotNull(lecturers.email)),
      db
        .select({ value: count() })
        .from(lecturers)
        .innerJoin(
          storageObjects,
          and(
            eq(storageObjects.id, lecturers.photoStorageObjectId),
            eq(storageObjects.status, "completed"),
          ),
        ),
      db.$count(lecturerCourses),
    ]);

  return {
    courseAssignments,
    totalLecturers,
    withEmail,
    withPhoto: photoRows[0]?.value ?? 0,
  };
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

export async function getCachedSerializedLecturers(): Promise<LecturerRow[]> {
  return getCachedJson({
    key: PUBLIC_CACHE_KEYS.lecturers,
    load: getSerializedLecturers,
    schema: z.array(lecturerRowSchema),
    ttlSeconds: PUBLIC_CACHE_TTL_SECONDS,
  });
}

async function getCoursesByLecturerId(
  lecturerIds: number[],
): Promise<Map<number, LecturerCourse[]>> {
  if (lecturerIds.length === 0) return new Map();

  const assignmentRows = await db
    .select({
      lecturerId: lecturerCourses.lecturerId,
      courseId: courses.id,
      courseCode: courses.code,
      courseTitle: courses.title,
    })
    .from(lecturerCourses)
    .innerJoin(courses, eq(courses.id, lecturerCourses.courseId))
    .where(inArray(lecturerCourses.lecturerId, lecturerIds))
    .orderBy(asc(courses.code));
  const coursesByLecturerId = new Map<number, LecturerCourse[]>();

  for (const row of assignmentRows) {
    const lecturerCourse = {
      id: row.courseId,
      code: row.courseCode,
      title: row.courseTitle,
    };
    const existingCourses = coursesByLecturerId.get(row.lecturerId);

    if (existingCourses) {
      existingCourses.push(lecturerCourse);
    } else {
      coursesByLecturerId.set(row.lecturerId, [lecturerCourse]);
    }
  }

  return coursesByLecturerId;
}

function mapLecturerRow(
  row: {
    id: number;
    name: string;
    title: string | null;
    email: string | null;
    phone: string | null;
    officeLocation: string | null;
    officeHours: string | null;
    photoStorageObjectId: string | null;
    photoPublicUrl: string | null;
    photoObjectKey: string | null;
    photoOriginalFilename: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  coursesByLecturerId: Map<number, LecturerCourse[]>,
): LecturerListItem {
  return {
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
  };
}

function getLecturerWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const contactFilters = getDataTableFilterValues(query, "contactStatus");
  const photoFilters = getDataTableFilterValues(query, "photoStatus");

  if (query.search) {
    const pattern = `%${query.search}%`;
    const courseSearch = exists(
      db
        .select({ value: courses.id })
        .from(lecturerCourses)
        .innerJoin(courses, eq(courses.id, lecturerCourses.courseId))
        .where(
          and(
            eq(lecturerCourses.lecturerId, lecturers.id),
            or(ilike(courses.code, pattern), ilike(courses.title, pattern)),
          ),
        ),
    );
    const searchCondition = or(
      ilike(lecturers.name, pattern),
      ilike(lecturers.title, pattern),
      ilike(lecturers.email, pattern),
      ilike(lecturers.phone, pattern),
      ilike(lecturers.officeLocation, pattern),
      ilike(lecturers.officeHours, pattern),
      courseSearch,
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  const contactCondition = getContactCondition(contactFilters);
  const photoCondition = getPhotoCondition(photoFilters);
  if (contactCondition) conditions.push(contactCondition);
  if (photoCondition) conditions.push(photoCondition);

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getLecturerOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "name":
      return isAscending
        ? [asc(lecturers.name), asc(lecturers.id)]
        : [desc(lecturers.name), desc(lecturers.id)];
    case "contact":
      return isAscending
        ? [asc(lecturers.email), asc(lecturers.name)]
        : [desc(lecturers.email), asc(lecturers.name)];
    case "office":
      return isAscending
        ? [asc(lecturers.officeLocation), asc(lecturers.name)]
        : [desc(lecturers.officeLocation), asc(lecturers.name)];
    case "updatedAt":
      return isAscending
        ? [asc(lecturers.updatedAt), asc(lecturers.id)]
        : [desc(lecturers.updatedAt), desc(lecturers.id)];
    default:
      return [asc(lecturers.name), asc(lecturers.id)];
  }
}

function getContactCondition(values: string[]): SQL | undefined {
  const hasEmail = values.includes("has_email");
  const missingEmail = values.includes("missing_email");
  if (hasEmail === missingEmail) return undefined;
  return hasEmail ? isNotNull(lecturers.email) : isNull(lecturers.email);
}

function getPhotoCondition(values: string[]): SQL | undefined {
  const hasPhoto = values.includes("has_photo");
  const missingPhoto = values.includes("missing_photo");
  if (hasPhoto === missingPhoto) return undefined;
  return hasPhoto ? isNotNull(storageObjects.id) : isNull(storageObjects.id);
}
