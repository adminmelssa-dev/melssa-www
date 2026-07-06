import "server-only";

import { UploadThingStorageService } from "@/server/storage/providers/uploadthing/service";
import type { StorageService } from "@/server/storage/types";

let storageService: StorageService | null = null;

export function getStorageService(): StorageService {
  if (storageService) return storageService;

  storageService = new UploadThingStorageService();
  return storageService;
}
