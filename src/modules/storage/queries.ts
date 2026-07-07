import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sum,
  type SQL,
} from "drizzle-orm";
import {
  storageObjectStatusSchema,
  storageEndpointSchema,
  storageProviderSchema,
  type StorageObjectRow,
} from "@/modules/storage/contracts";
import {
  createDataTablePage,
  getDataTableFilterValues,
  getDataTableOffset,
  type DataTablePage,
  type DataTableQuery,
} from "@/lib/data-table-query";
import { db } from "@/server/db";
import {
  storageObjects,
  user,
} from "@/server/db/schema";

interface StorageObjectListItem {
  id: string;
  provider: StorageObjectRow["provider"];
  providerObjectId: string | null;
  objectKey: string;
  publicUrl: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  fileHash: string | null;
  endpoint: StorageObjectRow["endpoint"];
  status: StorageObjectRow["status"];
  uploadedBy: StorageObjectRow["uploadedBy"];
  completedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StorageObjectQueryRow {
  id: string;
  provider: StorageObjectRow["provider"];
  providerObjectId: string | null;
  objectKey: string;
  publicUrl: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  fileHash: string | null;
  endpoint: string;
  status: StorageObjectRow["status"];
  uploaderId: string | null;
  uploaderName: string | null;
  uploaderEmail: string | null;
  uploaderRole: StorageObjectRow["uploadedBy"] extends infer Uploader
    ? Uploader extends { role: infer Role }
      ? Role | null
      : null
    : null;
  completedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorageAdminStats {
  totalObjects: number;
  completedObjects: number;
  deletedObjects: number;
  completedBytes: number;
}

export async function getStorageObjects(): Promise<StorageObjectListItem[]> {
  const rows = await db
    .select({
      id: storageObjects.id,
      provider: storageObjects.provider,
      providerObjectId: storageObjects.providerObjectId,
      objectKey: storageObjects.objectKey,
      publicUrl: storageObjects.publicUrl,
      originalFilename: storageObjects.originalFilename,
      mimeType: storageObjects.mimeType,
      byteSize: storageObjects.byteSize,
      fileHash: storageObjects.fileHash,
      endpoint: storageObjects.endpoint,
      status: storageObjects.status,
      uploaderId: user.id,
      uploaderName: user.name,
      uploaderEmail: user.email,
      uploaderRole: user.role,
      completedAt: storageObjects.completedAt,
      deletedAt: storageObjects.deletedAt,
      createdAt: storageObjects.createdAt,
      updatedAt: storageObjects.updatedAt,
    })
    .from(storageObjects)
    .leftJoin(user, eq(user.id, storageObjects.uploadedByUserId))
    .orderBy(desc(storageObjects.createdAt));

  return rows.map(mapStorageObjectRow);
}

export function serializeStorageObject(
  item: StorageObjectListItem,
): StorageObjectRow {
  return {
    id: item.id,
    provider: item.provider,
    providerObjectId: item.providerObjectId,
    objectKey: item.objectKey,
    publicUrl: item.publicUrl,
    originalFilename: item.originalFilename,
    mimeType: item.mimeType,
    byteSize: item.byteSize,
    fileHash: item.fileHash,
    endpoint: item.endpoint,
    status: item.status,
    uploadedBy: item.uploadedBy,
    completedAt: item.completedAt?.toISOString() ?? null,
    deletedAt: item.deletedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getSerializedStorageObjects(): Promise<
  StorageObjectRow[]
> {
  const objects = await getStorageObjects();
  return objects.map((object) => serializeStorageObject(object));
}

export async function getSerializedStorageObjectPage(
  query: DataTableQuery,
): Promise<DataTablePage<StorageObjectRow>> {
  const where = getStorageObjectWhere(query);
  const [totalRows, rows] = await Promise.all([
    db.$count(storageObjects, where),
    db
      .select({
        id: storageObjects.id,
        provider: storageObjects.provider,
        providerObjectId: storageObjects.providerObjectId,
        objectKey: storageObjects.objectKey,
        publicUrl: storageObjects.publicUrl,
        originalFilename: storageObjects.originalFilename,
        mimeType: storageObjects.mimeType,
        byteSize: storageObjects.byteSize,
        fileHash: storageObjects.fileHash,
        endpoint: storageObjects.endpoint,
        status: storageObjects.status,
        uploaderId: user.id,
        uploaderName: user.name,
        uploaderEmail: user.email,
        uploaderRole: user.role,
        completedAt: storageObjects.completedAt,
        deletedAt: storageObjects.deletedAt,
        createdAt: storageObjects.createdAt,
        updatedAt: storageObjects.updatedAt,
      })
      .from(storageObjects)
      .leftJoin(user, eq(user.id, storageObjects.uploadedByUserId))
      .where(where)
      .orderBy(...getStorageObjectOrderBy(query))
      .limit(query.pageSize)
      .offset(getDataTableOffset(query)),
  ]);

  return createDataTablePage({
    items: rows
      .map(mapStorageObjectRow)
      .map((object) => serializeStorageObject(object)),
    query,
    totalRows,
  });
}

export async function getStorageAdminStats(): Promise<StorageAdminStats> {
  const [totalObjects, completedObjects, deletedObjects, completedBytesRow] =
    await Promise.all([
      db.$count(storageObjects),
      db.$count(storageObjects, eq(storageObjects.status, "completed")),
      db.$count(storageObjects, eq(storageObjects.status, "deleted")),
      db
        .select({ value: sum(storageObjects.byteSize) })
        .from(storageObjects)
        .where(eq(storageObjects.status, "completed")),
    ]);
  const completedBytes = Number(completedBytesRow[0]?.value ?? 0);

  return {
    completedBytes,
    completedObjects,
    deletedObjects,
    totalObjects,
  };
}

function mapStorageObjectRow(row: StorageObjectQueryRow): StorageObjectListItem {
  return {
    id: row.id,
    provider: row.provider,
    providerObjectId: row.providerObjectId,
    objectKey: row.objectKey,
    publicUrl: row.publicUrl,
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    byteSize: row.byteSize,
    fileHash: row.fileHash,
    endpoint: storageEndpointSchema.parse(row.endpoint),
    status: row.status,
    uploadedBy:
      row.uploaderId && row.uploaderName && row.uploaderEmail && row.uploaderRole
        ? {
            id: row.uploaderId,
            name: row.uploaderName,
            email: row.uploaderEmail,
            role: row.uploaderRole,
          }
        : null,
    completedAt: row.completedAt,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function getStorageObjectWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const endpointFilters = getValidEndpointFilters(
    getDataTableFilterValues(query, "endpoint"),
  );
  const providerFilters = getValidProviderFilters(
    getDataTableFilterValues(query, "provider"),
  );
  const statusFilters = getValidStatusFilters(
    getDataTableFilterValues(query, "status"),
  );

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(
      ilike(storageObjects.originalFilename, pattern),
      ilike(storageObjects.objectKey, pattern),
      ilike(storageObjects.mimeType, pattern),
      ilike(user.name, pattern),
      ilike(user.email, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (endpointFilters.length > 0) {
    conditions.push(inArray(storageObjects.endpoint, endpointFilters));
  }

  if (providerFilters.length > 0) {
    conditions.push(inArray(storageObjects.provider, providerFilters));
  }

  if (statusFilters.length > 0) {
    conditions.push(inArray(storageObjects.status, statusFilters));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getStorageObjectOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "originalFilename":
      return isAscending
        ? [asc(storageObjects.originalFilename), desc(storageObjects.createdAt)]
        : [desc(storageObjects.originalFilename), desc(storageObjects.createdAt)];
    case "endpoint":
      return isAscending
        ? [asc(storageObjects.endpoint), desc(storageObjects.createdAt)]
        : [desc(storageObjects.endpoint), desc(storageObjects.createdAt)];
    case "provider":
      return isAscending
        ? [asc(storageObjects.provider), desc(storageObjects.createdAt)]
        : [desc(storageObjects.provider), desc(storageObjects.createdAt)];
    case "status":
      return isAscending
        ? [asc(storageObjects.status), desc(storageObjects.createdAt)]
        : [desc(storageObjects.status), desc(storageObjects.createdAt)];
    case "byteSize":
      return isAscending
        ? [asc(storageObjects.byteSize), desc(storageObjects.createdAt)]
        : [desc(storageObjects.byteSize), desc(storageObjects.createdAt)];
    case "uploader":
      return isAscending
        ? [asc(user.email), desc(storageObjects.createdAt)]
        : [desc(user.email), desc(storageObjects.createdAt)];
    default:
      return isAscending
        ? [asc(storageObjects.completedAt), asc(storageObjects.createdAt)]
        : [desc(storageObjects.completedAt), desc(storageObjects.createdAt)];
  }
}

function getValidEndpointFilters(values: string[]): StorageObjectRow["endpoint"][] {
  return values.flatMap((value) => {
    const parsedValue = storageEndpointSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}

function getValidProviderFilters(values: string[]): StorageObjectRow["provider"][] {
  return values.flatMap((value) => {
    const parsedValue = storageProviderSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}

function getValidStatusFilters(values: string[]): StorageObjectRow["status"][] {
  return values.flatMap((value) => {
    const parsedValue = storageObjectStatusSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}
