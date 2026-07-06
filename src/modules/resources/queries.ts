import "server-only";

import {
  and,
  desc,
  eq,
} from "drizzle-orm";
import type { ResourceRow } from "@/modules/resources/contracts";
import { db } from "@/server/db";
import {
  courses,
  resources,
  storageObjects,
  user,
} from "@/server/db/schema";

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

export async function getSerializedPublishedResources(): Promise<ResourceRow[]> {
  const resourceRows = await getPublishedResources();
  return resourceRows.map((item) => serializeResource(item));
}
