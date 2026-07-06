import "server-only";

import { eq, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { storageObjects } from "@/server/db/schema";
import type { CompletedStorageUpload } from "@/server/storage/types";
import { getStorageService } from "@/server/storage";

export async function recordCompletedStorageUpload(
  upload: CompletedStorageUpload,
): Promise<CompletedStorageUpload> {
  await db.insert(storageObjects).values({
    id: upload.id,
    provider: "uploadthing",
    providerObjectId: upload.providerObjectId,
    objectKey: upload.objectKey,
    publicUrl: upload.publicUrl,
    originalFilename: upload.originalFilename,
    mimeType: upload.mimeType,
    byteSize: upload.byteSize,
    fileHash: upload.fileHash,
    endpoint: upload.endpoint,
    uploadedByUserId: upload.uploadedByUserId,
    status: "completed",
    completedAt: new Date(),
  });

  return upload;
}

export async function deleteStoredObjectsByKeys(objectKeys: string[]): Promise<void> {
  if (objectKeys.length === 0) return;

  await getStorageService().deleteObjectsByKeys(objectKeys);

  await db
    .update(storageObjects)
    .set({
      status: "deleted",
      deletedAt: new Date(),
    })
    .where(inArray(storageObjects.objectKey, objectKeys));
}

export async function deleteStoredObjectById(id: string): Promise<void> {
  const object = await db.query.storageObjects.findFirst({
    where: { id },
    columns: { objectKey: true },
  });

  if (!object) return;

  await deleteStoredObjectsByKeys([object.objectKey]);
}

export async function markStorageObjectDeleted(objectKey: string): Promise<void> {
  await db
    .update(storageObjects)
    .set({
      status: "deleted",
      deletedAt: new Date(),
    })
    .where(eq(storageObjects.objectKey, objectKey));
}
