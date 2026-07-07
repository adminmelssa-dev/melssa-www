import { z } from "zod";
import { userRoleSchema } from "@/modules/auth/contracts";
import { dataTablePageMetaSchema } from "@/lib/data-table-query";

export const storageProviderSchema = z.literal("uploadthing");

export const storageObjectStatusSchema = z.union([
  z.literal("completed"),
  z.literal("deleted"),
]);

export const storageEndpointSchema = z.union([
  z.literal("announcementAttachment"),
  z.literal("concernAttachment"),
  z.literal("editorImage"),
  z.literal("eventPoster"),
  z.literal("financeDocument"),
  z.literal("fundraisingCoverImage"),
  z.literal("galleryImage"),
  z.literal("lecturerPhoto"),
  z.literal("resourceFile"),
  z.literal("scholarshipAttachment"),
  z.literal("spotlightPhoto"),
]);

export type StorageProvider = z.infer<typeof storageProviderSchema>;
export type StorageObjectStatus = z.infer<typeof storageObjectStatusSchema>;
export type StorageEndpointValue = z.infer<typeof storageEndpointSchema>;

export const STORAGE_PROVIDER_LABELS: Record<StorageProvider, string> = {
  uploadthing: "UploadThing",
};

export const STORAGE_OBJECT_STATUS_LABELS: Record<
  StorageObjectStatus,
  string
> = {
  completed: "Completed",
  deleted: "Deleted",
};

export const STORAGE_ENDPOINT_LABELS: Record<StorageEndpointValue, string> = {
  announcementAttachment: "Announcement Attachment",
  concernAttachment: "Concern Attachment",
  editorImage: "Editor Image",
  eventPoster: "Event Poster",
  financeDocument: "Finance Document",
  fundraisingCoverImage: "Fundraising Cover Image",
  galleryImage: "Gallery Image",
  lecturerPhoto: "Lecturer Photo",
  resourceFile: "Resource File",
  scholarshipAttachment: "Scholarship Attachment",
  spotlightPhoto: "Spotlight Photo",
};

export const STORAGE_OBJECT_STATUS_OPTIONS: {
  value: StorageObjectStatus;
  label: string;
}[] = [
  { value: "completed", label: STORAGE_OBJECT_STATUS_LABELS.completed },
  { value: "deleted", label: STORAGE_OBJECT_STATUS_LABELS.deleted },
];

export const STORAGE_ENDPOINT_OPTIONS: {
  value: StorageEndpointValue;
  label: string;
}[] = [
  {
    value: "announcementAttachment",
    label: STORAGE_ENDPOINT_LABELS.announcementAttachment,
  },
  {
    value: "concernAttachment",
    label: STORAGE_ENDPOINT_LABELS.concernAttachment,
  },
  { value: "editorImage", label: STORAGE_ENDPOINT_LABELS.editorImage },
  { value: "eventPoster", label: STORAGE_ENDPOINT_LABELS.eventPoster },
  {
    value: "financeDocument",
    label: STORAGE_ENDPOINT_LABELS.financeDocument,
  },
  {
    value: "fundraisingCoverImage",
    label: STORAGE_ENDPOINT_LABELS.fundraisingCoverImage,
  },
  { value: "galleryImage", label: STORAGE_ENDPOINT_LABELS.galleryImage },
  { value: "lecturerPhoto", label: STORAGE_ENDPOINT_LABELS.lecturerPhoto },
  { value: "resourceFile", label: STORAGE_ENDPOINT_LABELS.resourceFile },
  {
    value: "scholarshipAttachment",
    label: STORAGE_ENDPOINT_LABELS.scholarshipAttachment,
  },
  { value: "spotlightPhoto", label: STORAGE_ENDPOINT_LABELS.spotlightPhoto },
];

export const storageUploaderSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
    role: userRoleSchema,
  })
  .nullable();

export const storageObjectRowSchema = z.object({
  id: z.string(),
  provider: storageProviderSchema,
  providerObjectId: z.string().nullable(),
  objectKey: z.string(),
  publicUrl: z.url(),
  originalFilename: z.string(),
  mimeType: z.string(),
  byteSize: z.number().int().min(0),
  fileHash: z.string().nullable(),
  endpoint: storageEndpointSchema,
  status: storageObjectStatusSchema,
  uploadedBy: storageUploaderSchema,
  completedAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminStorageResponseSchema = z.object({
  meta: dataTablePageMetaSchema,
  storageObjects: z.array(storageObjectRowSchema),
});

export type StorageUploader = z.infer<typeof storageUploaderSchema>;
export type StorageObjectRow = z.infer<typeof storageObjectRowSchema>;
export type AdminStorageResponse = z.infer<typeof adminStorageResponseSchema>;
