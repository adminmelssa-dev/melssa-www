import "server-only";

import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
} from "drizzle-orm";
import type {
  AcademicLevel,
  CourseRow,
  SemesterTerm,
} from "@/modules/academics/contracts";
import {
  academicLevelSchema,
  semesterTermSchema,
} from "@/modules/academics/contracts";
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

export interface CoursesAdminStats {
  totalCourses: number;
  levelGroups: number;
  linkedResources: number;
  lecturerAssignments: number;
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

export async function getSerializedCoursePage(
  query: DataTableQuery,
): Promise<DataTablePage<CourseRow>> {
  const where = getCourseWhere(query);
  const [totalRow] = await db
    .select({ value: count() })
    .from(courses)
    .where(where);
  const rows = await db
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
    .where(where)
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
    .orderBy(...getCourseOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));

  return createDataTablePage({
    items: rows.map((item) => serializeCourse(item)),
    query,
    totalRows: totalRow?.value ?? 0,
  });
}

export async function getCoursesAdminStats(): Promise<CoursesAdminStats> {
  const [totalCourses, levelRows, linkedResources, lecturerAssignments] =
    await Promise.all([
      db.$count(courses),
      db.selectDistinct({ level: courses.level }).from(courses),
      db.$count(resources),
      db.$count(lecturerCourses),
    ]);

  return {
    lecturerAssignments,
    levelGroups: levelRows.length,
    linkedResources,
    totalCourses,
  };
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

function getCourseWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const levelFilters = getValidLevelFilters(
    getDataTableFilterValues(query, "level"),
  );
  const semesterFilters = getValidSemesterFilters(
    getDataTableFilterValues(query, "semester"),
  );

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(
      ilike(courses.code, pattern),
      ilike(courses.title, pattern),
      ilike(courses.description, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (levelFilters.length > 0) conditions.push(inArray(courses.level, levelFilters));
  if (semesterFilters.length > 0) {
    conditions.push(inArray(courses.semester, semesterFilters));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getCourseOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "code":
      return isAscending
        ? [asc(courses.code), asc(courses.id)]
        : [desc(courses.code), desc(courses.id)];
    case "title":
      return isAscending
        ? [asc(courses.title), asc(courses.id)]
        : [desc(courses.title), desc(courses.id)];
    case "level":
      return isAscending
        ? [asc(courses.level), asc(courses.code)]
        : [desc(courses.level), asc(courses.code)];
    case "semester":
      return isAscending
        ? [asc(courses.semester), asc(courses.code)]
        : [desc(courses.semester), asc(courses.code)];
    case "updatedAt":
      return isAscending
        ? [asc(courses.updatedAt), asc(courses.id)]
        : [desc(courses.updatedAt), desc(courses.id)];
    default:
      return [asc(courses.level), asc(courses.semester), asc(courses.code)];
  }
}

function getValidLevelFilters(values: string[]): AcademicLevel[] {
  return values.flatMap((value) => {
    const parsedValue = academicLevelSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}

function getValidSemesterFilters(values: string[]): SemesterTerm[] {
  return values.flatMap((value) => {
    const parsedValue = semesterTermSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}
