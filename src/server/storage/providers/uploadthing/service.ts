import "server-only";

import { UTApi } from "uploadthing/server";
import { env } from "@/lib/env";
import type { StorageService } from "@/server/storage/types";

export class UploadThingStorageService implements StorageService {
  private readonly api: UTApi;

  constructor() {
    if (!env.UPLOADTHING_TOKEN) {
      throw new Error("UploadThing storage is not configured.");
    }

    this.api = new UTApi({ token: env.UPLOADTHING_TOKEN });
  }

  async deleteObjectsByKeys(objectKeys: string[]): Promise<void> {
    if (objectKeys.length === 0) return;

    const result = await this.api.deleteFiles(objectKeys);
    if (!result.success) {
      throw new Error("Failed to delete one or more uploaded files.");
    }
  }
}
