import { genUploader } from "uploadthing/client";
import { z } from "zod";
import type { UploadThingRouter } from "@/server/storage/providers/uploadthing/router";
import type { StorageEndpoint } from "@/lib/storage/endpoints";

const uploadedStorageObjectSchema = z.object({
  id: z.string().min(1),
  objectKey: z.string().min(1),
  publicUrl: z.url(),
});

export type UploadedStorageObject = z.infer<typeof uploadedStorageObjectSchema>;

const uploader = genUploader<UploadThingRouter>({
  url: "/api/uploadthing",
  fetch(input, init) {
    return fetch(input, {
      ...init,
      credentials: "include",
    });
  },
});

export async function uploadStorageFile({
  endpoint,
  file,
  onProgress,
}: {
  endpoint: StorageEndpoint;
  file: File;
  onProgress?: (progress: number) => void;
}): Promise<UploadedStorageObject> {
  const uploads = await uploader.uploadFiles(endpoint, {
    files: [file],
    onUploadProgress({ progress }) {
      onProgress?.(progress);
    },
  });
  const uploadedFile = uploads[0];

  if (!uploadedFile) {
    throw new Error("Upload did not return a file.");
  }

  return uploadedStorageObjectSchema.parse(uploadedFile.serverData);
}
