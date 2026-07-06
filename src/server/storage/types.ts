import type { StorageEndpoint } from "@/server/storage/endpoints";

export type StorageDriver = "uploadthing";

export interface CompletedStorageUpload {
  id: string;
  providerObjectId: string | null;
  objectKey: string;
  publicUrl: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  fileHash: string | null;
  endpoint: StorageEndpoint;
  uploadedByUserId: string | null;
}

export interface StorageService {
  deleteObjectsByKeys(objectKeys: string[]): Promise<void>;
}
