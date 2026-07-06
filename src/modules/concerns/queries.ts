import "server-only";

import {
  and,
  desc,
  eq,
} from "drizzle-orm";
import type { ConcernRow } from "@/modules/concerns/contracts";
import { db } from "@/server/db";
import {
  anonymousConcerns,
  storageObjects,
  user,
} from "@/server/db/schema";

interface ConcernListItem {
  id: number;
  category: ConcernRow["category"];
  subject: string;
  message: string;
  status: ConcernRow["status"];
  attachment: ConcernRow["attachment"];
  reviewedBy: ConcernRow["reviewedBy"];
  reviewedAt: Date | null;
  internalNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ConcernQueryRow {
  id: number;
  category: ConcernRow["category"];
  subject: string;
  message: string;
  status: ConcernRow["status"];
  attachmentId: string | null;
  attachmentPublicUrl: string | null;
  attachmentObjectKey: string | null;
  attachmentOriginalFilename: string | null;
  attachmentMimeType: string | null;
  attachmentByteSize: number | null;
  reviewerId: string | null;
  reviewerName: string | null;
  reviewerEmail: string | null;
  reviewedAt: Date | null;
  internalNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getConcerns(): Promise<ConcernListItem[]> {
  const rows = await concernSelect()
    .from(anonymousConcerns)
    .leftJoin(user, eq(user.id, anonymousConcerns.reviewedByUserId))
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, anonymousConcerns.attachmentStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .orderBy(desc(anonymousConcerns.createdAt));

  return rows.map(mapConcernRow);
}

export function serializeConcern(item: ConcernListItem): ConcernRow {
  return {
    id: item.id,
    category: item.category,
    subject: item.subject,
    message: item.message,
    status: item.status,
    attachment: item.attachment,
    reviewedBy: item.reviewedBy,
    reviewedAt: item.reviewedAt?.toISOString() ?? null,
    internalNote: item.internalNote,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getSerializedConcerns(): Promise<ConcernRow[]> {
  const concerns = await getConcerns();
  return concerns.map((concern) => serializeConcern(concern));
}

function concernSelect() {
  return db.select({
    id: anonymousConcerns.id,
    category: anonymousConcerns.category,
    subject: anonymousConcerns.subject,
    message: anonymousConcerns.message,
    status: anonymousConcerns.status,
    attachmentId: storageObjects.id,
    attachmentPublicUrl: storageObjects.publicUrl,
    attachmentObjectKey: storageObjects.objectKey,
    attachmentOriginalFilename: storageObjects.originalFilename,
    attachmentMimeType: storageObjects.mimeType,
    attachmentByteSize: storageObjects.byteSize,
    reviewerId: user.id,
    reviewerName: user.name,
    reviewerEmail: user.email,
    reviewedAt: anonymousConcerns.reviewedAt,
    internalNote: anonymousConcerns.internalNote,
    createdAt: anonymousConcerns.createdAt,
    updatedAt: anonymousConcerns.updatedAt,
  });
}

function mapConcernRow(row: ConcernQueryRow): ConcernListItem {
  return {
    id: row.id,
    category: row.category,
    subject: row.subject,
    message: row.message,
    status: row.status,
    attachment:
      row.attachmentId &&
      row.attachmentPublicUrl &&
      row.attachmentObjectKey &&
      row.attachmentOriginalFilename &&
      row.attachmentMimeType &&
      row.attachmentByteSize !== null
        ? {
            id: row.attachmentId,
            publicUrl: row.attachmentPublicUrl,
            objectKey: row.attachmentObjectKey,
            originalFilename: row.attachmentOriginalFilename,
            mimeType: row.attachmentMimeType,
            byteSize: row.attachmentByteSize,
          }
        : null,
    reviewedBy:
      row.reviewerId && row.reviewerName && row.reviewerEmail
        ? {
            id: row.reviewerId,
            name: row.reviewerName,
            email: row.reviewerEmail,
          }
        : null,
    reviewedAt: row.reviewedAt,
    internalNote: row.internalNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
