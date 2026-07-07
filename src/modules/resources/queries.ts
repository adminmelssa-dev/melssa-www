import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import {
  resourceTypeSchema,
  resourceRowSchema,
  type ResourceRow,
} from "@/modules/resources/contracts";
import {
  academicLevelSchema,
  semesterTermSchema,
} from "@/modules/academics/contracts";
import { contentStatusSchema } from "@/modules/content/contracts";
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
  resources,
  storageObjects,
  user,
} from "@/server/db/schema";
import {
  getCachedJson,
  PUBLIC_CACHE_KEYS,
  PUBLIC_CACHE_TTL_SECONDS,
} from "@/server/cache";

interface ResourceListItem {
  id: number;
  title: string;
  description: string | null;
  type: ResourceRow["type"];
  level: ResourceRow["level"];
  semester: ResourceRow["semester"];
  academicYear: string | null;
  status: ResourceRow["status"];
  course: ResourceRow["course"];
  file: ResourceRow["file"];
  uploadedBy: ResourceRow["uploadedBy"];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourcesAdminStats {
  totalResources: number;
  publishedResources: number;
  draftResources: number;
  archivedResources: number;
}

export async function getResources(): Promise<ResourceListItem[]> {
  const rows = await db
    .select({
      id: resources.id,
      title: resources.title,
      description: resources.description,
      type: resources.type,
      level: resources.level,
      semester: resources.semester,
      academicYear: resources.academicYear,
      status: resources.status,
      courseId: courses.id,
      courseCode: courses.code,
      courseTitle: courses.title,
      fileId: storageObjects.id,
      filePublicUrl: storageObjects.publicUrl,
      fileObjectKey: storageObjects.objectKey,
      fileOriginalFilename: storageObjects.originalFilename,
      fileMimeType: storageObjects.mimeType,
      fileByteSize: storageObjects.byteSize,
      uploaderId: user.id,
      uploaderName: user.name,
      uploaderEmail: user.email,
      publishedAt: resources.publishedAt,
      createdAt: resources.createdAt,
      updatedAt: resources.updatedAt,
    })
    .from(resources)
    .innerJoin(
      storageObjects,
      and(
        eq(storageObjects.id, resources.storageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .leftJoin(courses, eq(courses.id, resources.courseId))
    .leftJoin(user, eq(user.id, resources.uploadedByUserId))
    .orderBy(desc(resources.createdAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    level: row.level,
    semester: row.semester,
    academicYear: row.academicYear,
    status: row.status,
    course:
      row.courseId && row.courseCode && row.courseTitle
        ? {
            id: row.courseId,
            code: row.courseCode,
            title: row.courseTitle,
          }
        : null,
    file: {
      id: row.fileId,
      publicUrl: row.filePublicUrl,
      objectKey: row.fileObjectKey,
      originalFilename: row.fileOriginalFilename,
      mimeType: row.fileMimeType,
      byteSize: row.fileByteSize,
    },
    uploadedBy:
      row.uploaderId && row.uploaderName && row.uploaderEmail
        ? {
            id: row.uploaderId,
            name: row.uploaderName,
            email: row.uploaderEmail,
          }
        : null,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function getPublishedResources(): Promise<ResourceListItem[]> {
  const resourceRows = await getResources();
  return resourceRows.filter((resource) => resource.status === "published");
}

export function serializeResource(item: ResourceListItem): ResourceRow {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type,
    level: item.level,
    semester: item.semester,
    academicYear: item.academicYear,
    status: item.status,
    course: item.course,
    file: item.file,
    uploadedBy: item.uploadedBy,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getSerializedResources(): Promise<ResourceRow[]> {
  const resourceRows = await getResources();
  return resourceRows.map((item) => serializeResource(item));
}

export async function getSerializedResourcePage(
  query: DataTableQuery,
): Promise<DataTablePage<ResourceRow>> {
  const where = getResourceWhere(query);
  const [totalRow] = await db
    .select({ value: count() })
    .from(resources)
    .innerJoin(
      storageObjects,
      and(
        eq(storageObjects.id, resources.storageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .leftJoin(courses, eq(courses.id, resources.courseId))
    .leftJoin(user, eq(user.id, resources.uploadedByUserId))
    .where(where);
  const rows = await db
    .select({
      id: resources.id,
      title: resources.title,
      description: resources.description,
      type: resources.type,
      level: resources.level,
      semester: resources.semester,
      academicYear: resources.academicYear,
      status: resources.status,
      courseId: courses.id,
      courseCode: courses.code,
      courseTitle: courses.title,
      fileId: storageObjects.id,
      filePublicUrl: storageObjects.publicUrl,
      fileObjectKey: storageObjects.objectKey,
      fileOriginalFilename: storageObjects.originalFilename,
      fileMimeType: storageObjects.mimeType,
      fileByteSize: storageObjects.byteSize,
      uploaderId: user.id,
      uploaderName: user.name,
      uploaderEmail: user.email,
      publishedAt: resources.publishedAt,
      createdAt: resources.createdAt,
      updatedAt: resources.updatedAt,
    })
    .from(resources)
    .innerJoin(
      storageObjects,
      and(
        eq(storageObjects.id, resources.storageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .leftJoin(courses, eq(courses.id, resources.courseId))
    .leftJoin(user, eq(user.id, resources.uploadedByUserId))
    .where(where)
    .orderBy(...getResourceOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));

  return createDataTablePage({
    items: rows.map(mapResourceRow).map((item) => serializeResource(item)),
    query,
    totalRows: totalRow?.value ?? 0,
  });
}

export async function getResourcesAdminStats(): Promise<ResourcesAdminStats> {
  const [totalResources, publishedResources, draftResources, archivedResources] =
    await Promise.all([
      db.$count(resources),
      db.$count(resources, eq(resources.status, "published")),
      db.$count(resources, eq(resources.status, "draft")),
      db.$count(resources, eq(resources.status, "archived")),
    ]);

  return {
    archivedResources,
    draftResources,
    publishedResources,
    totalResources,
  };
}

export async function getSerializedPublishedResources(): Promise<ResourceRow[]> {
  return getCachedJson({
    key: PUBLIC_CACHE_KEYS.resources,
    load: async () => {
      const resourceRows = await getPublishedResources();
      return resourceRows.map((item) => serializeResource(item));
    },
    schema: z.array(resourceRowSchema),
    ttlSeconds: PUBLIC_CACHE_TTL_SECONDS,
  });
}

function mapResourceRow(row: {
  id: number;
  title: string;
  description: string | null;
  type: ResourceRow["type"];
  level: ResourceRow["level"];
  semester: ResourceRow["semester"];
  academicYear: string | null;
  status: ResourceRow["status"];
  courseId: number | null;
  courseCode: string | null;
  courseTitle: string | null;
  fileId: string;
  filePublicUrl: string;
  fileObjectKey: string;
  fileOriginalFilename: string;
  fileMimeType: string;
  fileByteSize: number;
  uploaderId: string | null;
  uploaderName: string | null;
  uploaderEmail: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ResourceListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    level: row.level,
    semester: row.semester,
    academicYear: row.academicYear,
    status: row.status,
    course:
      row.courseId && row.courseCode && row.courseTitle
        ? {
            id: row.courseId,
            code: row.courseCode,
            title: row.courseTitle,
          }
        : null,
    file: {
      id: row.fileId,
      publicUrl: row.filePublicUrl,
      objectKey: row.fileObjectKey,
      originalFilename: row.fileOriginalFilename,
      mimeType: row.fileMimeType,
      byteSize: row.fileByteSize,
    },
    uploadedBy:
      row.uploaderId && row.uploaderName && row.uploaderEmail
        ? {
            id: row.uploaderId,
            name: row.uploaderName,
            email: row.uploaderEmail,
          }
        : null,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function getResourceWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const typeFilters = getValidTypeFilters(getDataTableFilterValues(query, "type"));
  const levelFilters = getValidLevelFilters(
    getDataTableFilterValues(query, "level"),
  );
  const semesterFilters = getValidSemesterFilters(
    getDataTableFilterValues(query, "semester"),
  );
  const statusFilters = getValidStatusFilters(
    getDataTableFilterValues(query, "status"),
  );

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(
      ilike(resources.title, pattern),
      ilike(resources.description, pattern),
      ilike(resources.academicYear, pattern),
      ilike(storageObjects.originalFilename, pattern),
      ilike(courses.code, pattern),
      ilike(courses.title, pattern),
      ilike(user.name, pattern),
      ilike(user.email, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (typeFilters.length > 0) conditions.push(inArray(resources.type, typeFilters));
  if (levelFilters.length > 0) {
    conditions.push(inArray(resources.level, levelFilters));
  }
  if (semesterFilters.length > 0) {
    conditions.push(inArray(resources.semester, semesterFilters));
  }
  if (statusFilters.length > 0) {
    conditions.push(inArray(resources.status, statusFilters));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getResourceOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "title":
      return isAscending
        ? [asc(resources.title), desc(resources.id)]
        : [desc(resources.title), desc(resources.id)];
    case "type":
      return isAscending
        ? [asc(resources.type), desc(resources.id)]
        : [desc(resources.type), desc(resources.id)];
    case "level":
      return isAscending
        ? [asc(resources.level), desc(resources.id)]
        : [desc(resources.level), desc(resources.id)];
    case "semester":
      return isAscending
        ? [asc(resources.semester), desc(resources.id)]
        : [desc(resources.semester), desc(resources.id)];
    case "course":
      return isAscending
        ? [asc(courses.code), desc(resources.id)]
        : [desc(courses.code), desc(resources.id)];
    case "status":
      return isAscending
        ? [asc(resources.status), desc(resources.id)]
        : [desc(resources.status), desc(resources.id)];
    case "fileSize":
      return isAscending
        ? [asc(storageObjects.byteSize), desc(resources.id)]
        : [desc(storageObjects.byteSize), desc(resources.id)];
    default:
      return isAscending
        ? [asc(resources.updatedAt), asc(resources.id)]
        : [desc(resources.updatedAt), desc(resources.id)];
  }
}

function getValidTypeFilters(values: string[]): ResourceRow["type"][] {
  return values.flatMap((value) => {
    const parsedValue = resourceTypeSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}

function getValidLevelFilters(values: string[]): ResourceRow["level"][] {
  return values.flatMap((value) => {
    const parsedValue = academicLevelSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}

function getValidSemesterFilters(values: string[]): ResourceRow["semester"][] {
  return values.flatMap((value) => {
    const parsedValue = semesterTermSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}

function getValidStatusFilters(values: string[]): ResourceRow["status"][] {
  return values.flatMap((value) => {
    const parsedValue = contentStatusSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}
