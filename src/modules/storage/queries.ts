import "server-only";

import { desc, eq } from "drizzle-orm";
import {
  storageEndpointSchema,
  type StorageObjectRow,
} from "@/modules/storage/contracts";
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

  return rows.map((row) => ({
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
  }));
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
