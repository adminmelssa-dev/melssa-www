import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";
import {
  concernCategorySchema,
  concernStatusSchema,
  type ConcernRow,
} from "@/modules/concerns/contracts";
import {
  createDataTablePage,
  getDataTableFilterValues,
  getDataTableOffset,
  type DataTablePage,
  type DataTableQuery,
} from "@/lib/data-table-query";
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

export interface ConcernsAdminStats {
  totalConcerns: number;
  newConcerns: number;
  resolvedConcerns: number;
  archivedConcerns: number;
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

export async function getSerializedConcernPage(
  query: DataTableQuery,
): Promise<DataTablePage<ConcernRow>> {
  const where = getConcernWhere(query);
  const [totalRow] = await db
    .select({ value: count() })
    .from(anonymousConcerns)
    .leftJoin(user, eq(user.id, anonymousConcerns.reviewedByUserId))
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, anonymousConcerns.attachmentStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .where(where);
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
    .where(where)
    .orderBy(...getConcernOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));

  return createDataTablePage({
    items: rows.map(mapConcernRow).map((concern) => serializeConcern(concern)),
    query,
    totalRows: totalRow?.value ?? 0,
  });
}

export async function getConcernsAdminStats(): Promise<ConcernsAdminStats> {
  const [totalConcerns, newConcerns, resolvedConcerns, archivedConcerns] =
    await Promise.all([
      db.$count(anonymousConcerns),
      db.$count(anonymousConcerns, eq(anonymousConcerns.status, "new")),
      db.$count(anonymousConcerns, eq(anonymousConcerns.status, "resolved")),
      db.$count(anonymousConcerns, eq(anonymousConcerns.status, "archived")),
    ]);

  return {
    archivedConcerns,
    newConcerns,
    resolvedConcerns,
    totalConcerns,
  };
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

function getConcernWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const categoryFilters = getValidCategoryFilters(
    getDataTableFilterValues(query, "category"),
  );
  const statusFilters = getValidStatusFilters(
    getDataTableFilterValues(query, "status"),
  );
  const attachmentFilters = getDataTableFilterValues(query, "attachmentStatus");

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(
      ilike(anonymousConcerns.subject, pattern),
      ilike(anonymousConcerns.message, pattern),
      ilike(anonymousConcerns.internalNote, pattern),
      ilike(storageObjects.originalFilename, pattern),
      ilike(user.name, pattern),
      ilike(user.email, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (categoryFilters.length > 0) {
    conditions.push(inArray(anonymousConcerns.category, categoryFilters));
  }

  if (statusFilters.length > 0) {
    conditions.push(inArray(anonymousConcerns.status, statusFilters));
  }

  if (attachmentFilters.length === 1) {
    const attachmentFilter = attachmentFilters[0];
    if (attachmentFilter === "has_attachment") {
      conditions.push(isNotNull(storageObjects.id));
    } else if (attachmentFilter === "no_attachment") {
      conditions.push(isNull(storageObjects.id));
    }
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getConcernOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "subject":
      return isAscending
        ? [asc(anonymousConcerns.subject), desc(anonymousConcerns.id)]
        : [desc(anonymousConcerns.subject), desc(anonymousConcerns.id)];
    case "category":
      return isAscending
        ? [asc(anonymousConcerns.category), desc(anonymousConcerns.id)]
        : [desc(anonymousConcerns.category), desc(anonymousConcerns.id)];
    case "status":
      return isAscending
        ? [asc(anonymousConcerns.status), desc(anonymousConcerns.id)]
        : [desc(anonymousConcerns.status), desc(anonymousConcerns.id)];
    case "attachment":
      return isAscending
        ? [asc(storageObjects.originalFilename), desc(anonymousConcerns.id)]
        : [desc(storageObjects.originalFilename), desc(anonymousConcerns.id)];
    case "reviewedAt":
      return isAscending
        ? [asc(anonymousConcerns.reviewedAt), asc(anonymousConcerns.id)]
        : [desc(anonymousConcerns.reviewedAt), desc(anonymousConcerns.id)];
    default:
      return isAscending
        ? [asc(anonymousConcerns.createdAt), asc(anonymousConcerns.id)]
        : [desc(anonymousConcerns.createdAt), desc(anonymousConcerns.id)];
  }
}

function getValidCategoryFilters(values: string[]): ConcernRow["category"][] {
  return values.flatMap((value) => {
    const parsedValue = concernCategorySchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}

function getValidStatusFilters(values: string[]): ConcernRow["status"][] {
  return values.flatMap((value) => {
    const parsedValue = concernStatusSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}
