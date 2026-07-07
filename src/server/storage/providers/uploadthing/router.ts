import "server-only";

import { randomUUID } from "node:crypto";
import {
  createUploadthing,
  type FileRouter,
  UTFiles,
} from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import {
  getStorageEndpointConfig,
  isAcceptedFile,
  type StorageEndpoint,
} from "@/server/storage/endpoints";
import { recordCompletedStorageUpload } from "@/server/storage/objects";
import { getSession } from "@/server/auth/guards";
import { env } from "@/lib/env";

const upload = createUploadthing();

interface UploadMetadata {
  endpoint: StorageEndpoint;
  userId: string;
}

function endpointRoute(endpoint: StorageEndpoint) {
  const config = getStorageEndpointConfig(endpoint);

  return upload({
    [config.kind]: {
      maxFileSize: config.maxFileSize,
      maxFileCount: config.maxFileCount,
    },
  })
    .middleware(async ({ files }) => {
      if (endpoint === "scholarshipAttachment" && !env.SCHOLARSHIPS_ENABLED) {
        throw new UploadThingError({
          code: "FORBIDDEN",
          message: "Scholarship uploads are not enabled.",
        });
      }

      if (!env.UPLOADTHING_TOKEN) {
        throw new UploadThingError({
          code: "MISSING_ENV",
          message: "UploadThing storage is not configured.",
        });
      }

      const session = await getSession();
      if (!session) {
        throw new UploadThingError({
          code: "FORBIDDEN",
          message: "You must be signed in to upload files.",
        });
      }

      for (const file of files) {
        if (file.size > config.maxFileSizeBytes) {
          throw new UploadThingError({
            code: "TOO_LARGE",
            message: `${file.name} is larger than the allowed upload size.`,
          });
        }

        if (
          !isAcceptedFile({
            name: file.name,
            mimeType: file.type,
            config,
          })
        ) {
          throw new UploadThingError({
            code: "BAD_REQUEST",
            message: `${file.name} is not an accepted file type.`,
          });
        }
      }

      return {
        endpoint,
        userId: session.user.id,
        [UTFiles]: files.map((file) => ({
          ...file,
          customId: randomUUID(),
        })),
      } satisfies UploadMetadata & {
        [UTFiles]: Array<(typeof files)[number] & { customId: string }>;
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const id = file.customId ?? randomUUID();
      const completed = await recordCompletedStorageUpload({
        id,
        providerObjectId: file.key,
        objectKey: file.key,
        publicUrl: file.ufsUrl,
        originalFilename: file.name,
        mimeType: file.type,
        byteSize: file.size,
        fileHash: file.fileHash,
        endpoint: metadata.endpoint,
        uploadedByUserId: metadata.userId,
      });

      return {
        id: completed.id,
        objectKey: completed.objectKey,
        publicUrl: completed.publicUrl,
      };
    });
}

export const uploadThingRouter = {
  announcementAttachment: endpointRoute("announcementAttachment"),
  concernAttachment: endpointRoute("concernAttachment"),
  editorImage: endpointRoute("editorImage"),
  eventPoster: endpointRoute("eventPoster"),
  financeDocument: endpointRoute("financeDocument"),
  fundraisingCoverImage: endpointRoute("fundraisingCoverImage"),
  galleryImage: endpointRoute("galleryImage"),
  lecturerPhoto: endpointRoute("lecturerPhoto"),
  resourceFile: endpointRoute("resourceFile"),
  scholarshipAttachment: endpointRoute("scholarshipAttachment"),
  spotlightPhoto: endpointRoute("spotlightPhoto"),
} satisfies FileRouter;

export type UploadThingRouter = typeof uploadThingRouter;
