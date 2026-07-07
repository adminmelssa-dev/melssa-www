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
  financeDocumentTypeSchema,
  financeDocumentRowSchema,
  type FinanceDocumentRow,
} from "@/modules/finance/contracts";
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
  financeDocuments,
  storageObjects,
  user,
} from "@/server/db/schema";
import {
  getCachedJson,
  PUBLIC_CACHE_KEYS,
  PUBLIC_CACHE_TTL_SECONDS,
} from "@/server/cache";

interface FinanceDocumentListItem {
  id: number;
  title: string;
  summary: string | null;
  type: FinanceDocumentRow["type"];
  status: FinanceDocumentRow["status"];
  academicYear: string;
  semester: FinanceDocumentRow["semester"];
  programmeName: string | null;
  datePresented: Date | null;
  file: FinanceDocumentRow["file"];
  creator: FinanceDocumentRow["creator"];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FinanceDocumentQueryRow {
  id: number;
  title: string;
  summary: string | null;
  type: FinanceDocumentRow["type"];
  status: FinanceDocumentRow["status"];
  academicYear: string;
  semester: FinanceDocumentRow["semester"];
  programmeName: string | null;
  datePresented: Date | null;
  fileId: string | null;
  filePublicUrl: string | null;
  fileObjectKey: string | null;
  fileOriginalFilename: string | null;
  fileMimeType: string | null;
  fileByteSize: number | null;
  fileStatus: "completed" | "deleted" | null;
  creatorId: string | null;
  creatorName: string | null;
  creatorEmail: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinanceStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

export async function getFinanceDocuments(): Promise<
  FinanceDocumentListItem[]
> {
  const rows = await financeDocumentSelect()
    .from(financeDocuments)
    .leftJoin(
      storageObjects,
      eq(storageObjects.id, financeDocuments.storageObjectId),
    )
    .leftJoin(user, eq(user.id, financeDocuments.createdById))
    .orderBy(
      desc(financeDocuments.academicYear),
      desc(financeDocuments.publishedAt),
      desc(financeDocuments.createdAt),
    );

  return rows.map(mapFinanceDocumentRow);
}

export async function getPublishedFinanceDocuments(): Promise<
  FinanceDocumentListItem[]
> {
  const rows = await financeDocumentSelect()
    .from(financeDocuments)
    .innerJoin(
      storageObjects,
      and(
        eq(storageObjects.id, financeDocuments.storageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .leftJoin(user, eq(user.id, financeDocuments.createdById))
    .where(eq(financeDocuments.status, "published"))
    .orderBy(
      desc(financeDocuments.academicYear),
      desc(financeDocuments.publishedAt),
      desc(financeDocuments.createdAt),
    );

  return rows.map(mapFinanceDocumentRow);
}

export function serializeFinanceDocument(
  item: FinanceDocumentListItem,
): FinanceDocumentRow {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    type: item.type,
    status: item.status,
    academicYear: item.academicYear,
    semester: item.semester,
    programmeName: item.programmeName,
    datePresented: item.datePresented?.toISOString() ?? null,
    file: item.file,
    creator: item.creator,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getSerializedFinanceDocuments(): Promise<
  FinanceDocumentRow[]
> {
  const documents = await getFinanceDocuments();
  return documents.map((document) => serializeFinanceDocument(document));
}

export async function getSerializedFinanceDocumentPage(
  query: DataTableQuery,
): Promise<DataTablePage<FinanceDocumentRow>> {
  const where = getFinanceDocumentWhere(query);
  const [totalRow] = await db
    .select({ value: count() })
    .from(financeDocuments)
    .leftJoin(
      storageObjects,
      eq(storageObjects.id, financeDocuments.storageObjectId),
    )
    .leftJoin(user, eq(user.id, financeDocuments.createdById))
    .where(where);
  const rows = await financeDocumentSelect()
    .from(financeDocuments)
    .leftJoin(
      storageObjects,
      eq(storageObjects.id, financeDocuments.storageObjectId),
    )
    .leftJoin(user, eq(user.id, financeDocuments.createdById))
    .where(where)
    .orderBy(...getFinanceDocumentOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));

  return createDataTablePage({
    items: rows
      .map(mapFinanceDocumentRow)
      .map((document) => serializeFinanceDocument(document)),
    query,
    totalRows: totalRow?.value ?? 0,
  });
}

export async function getFinanceStats(): Promise<FinanceStats> {
  const [total, published, draft, archived] = await Promise.all([
    db.$count(financeDocuments),
    db.$count(financeDocuments, eq(financeDocuments.status, "published")),
    db.$count(financeDocuments, eq(financeDocuments.status, "draft")),
    db.$count(financeDocuments, eq(financeDocuments.status, "archived")),
  ]);

  return { archived, draft, published, total };
}

export async function getSerializedPublishedFinanceDocuments(): Promise<
  FinanceDocumentRow[]
> {
  return getCachedJson({
    key: PUBLIC_CACHE_KEYS.finance,
    load: async () => {
      const documents = await getPublishedFinanceDocuments();
      return documents.map((document) => serializeFinanceDocument(document));
    },
    schema: z.array(financeDocumentRowSchema),
    ttlSeconds: PUBLIC_CACHE_TTL_SECONDS,
  });
}

function financeDocumentSelect() {
  return db.select({
    id: financeDocuments.id,
    title: financeDocuments.title,
    summary: financeDocuments.summary,
    type: financeDocuments.type,
    status: financeDocuments.status,
    academicYear: financeDocuments.academicYear,
    semester: financeDocuments.semester,
    programmeName: financeDocuments.programmeName,
    datePresented: financeDocuments.datePresented,
    fileId: storageObjects.id,
    filePublicUrl: storageObjects.publicUrl,
    fileObjectKey: storageObjects.objectKey,
    fileOriginalFilename: storageObjects.originalFilename,
    fileMimeType: storageObjects.mimeType,
    fileByteSize: storageObjects.byteSize,
    fileStatus: storageObjects.status,
    creatorId: user.id,
    creatorName: user.name,
    creatorEmail: user.email,
    publishedAt: financeDocuments.publishedAt,
    createdAt: financeDocuments.createdAt,
    updatedAt: financeDocuments.updatedAt,
  });
}

function mapFinanceDocumentRow(
  row: FinanceDocumentQueryRow,
): FinanceDocumentListItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    type: row.type,
    status: row.status,
    academicYear: row.academicYear,
    semester: row.semester,
    programmeName: row.programmeName,
    datePresented: row.datePresented,
    file:
      row.fileId &&
      row.filePublicUrl &&
      row.fileObjectKey &&
      row.fileOriginalFilename &&
      row.fileMimeType &&
      row.fileByteSize !== null &&
      row.fileStatus === "completed"
        ? {
            id: row.fileId,
            publicUrl: row.filePublicUrl,
            objectKey: row.fileObjectKey,
            originalFilename: row.fileOriginalFilename,
            mimeType: row.fileMimeType,
            byteSize: row.fileByteSize,
          }
        : null,
    creator:
      row.creatorId && row.creatorName && row.creatorEmail
        ? {
            id: row.creatorId,
            name: row.creatorName,
            email: row.creatorEmail,
          }
        : null,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function getFinanceDocumentWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const typeFilters = getValidTypeFilters(getDataTableFilterValues(query, "type"));
  const statusFilters = getValidStatusFilters(
    getDataTableFilterValues(query, "status"),
  );

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(
      ilike(financeDocuments.title, pattern),
      ilike(financeDocuments.summary, pattern),
      ilike(financeDocuments.academicYear, pattern),
      ilike(financeDocuments.programmeName, pattern),
      ilike(storageObjects.originalFilename, pattern),
      ilike(user.name, pattern),
      ilike(user.email, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (typeFilters.length > 0) {
    conditions.push(inArray(financeDocuments.type, typeFilters));
  }

  if (statusFilters.length > 0) {
    conditions.push(inArray(financeDocuments.status, statusFilters));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getFinanceDocumentOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "title":
      return isAscending
        ? [asc(financeDocuments.title), desc(financeDocuments.id)]
        : [desc(financeDocuments.title), desc(financeDocuments.id)];
    case "type":
      return isAscending
        ? [asc(financeDocuments.type), desc(financeDocuments.id)]
        : [desc(financeDocuments.type), desc(financeDocuments.id)];
    case "status":
      return isAscending
        ? [asc(financeDocuments.status), desc(financeDocuments.id)]
        : [desc(financeDocuments.status), desc(financeDocuments.id)];
    case "academicYear":
      return isAscending
        ? [asc(financeDocuments.academicYear), desc(financeDocuments.id)]
        : [desc(financeDocuments.academicYear), desc(financeDocuments.id)];
    default:
      return isAscending
        ? [asc(financeDocuments.updatedAt), asc(financeDocuments.id)]
        : [desc(financeDocuments.updatedAt), desc(financeDocuments.id)];
  }
}

function getValidTypeFilters(values: string[]): FinanceDocumentRow["type"][] {
  return values.flatMap((value) => {
    const parsedValue = financeDocumentTypeSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}

function getValidStatusFilters(values: string[]): FinanceDocumentRow["status"][] {
  return values.flatMap((value) => {
    const parsedValue = contentStatusSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}
