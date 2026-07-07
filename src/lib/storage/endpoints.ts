export type StorageEndpoint =
  | "announcementAttachment"
  | "concernAttachment"
  | "editorImage"
  | "eventPoster"
  | "financeDocument"
  | "fundraisingCoverImage"
  | "galleryImage"
  | "lecturerPhoto"
  | "resourceFile"
  | "scholarshipAttachment"
  | "spotlightPhoto";

export type StorageFileKind = "image" | "blob";

export type StorageMaxFileSize = "4MB" | "8MB" | "16MB";

export interface StorageEndpointConfig {
  kind: StorageFileKind;
  maxFileSize: StorageMaxFileSize;
  maxFileSizeBytes: number;
  maxFileCount: number;
  acceptedMimeTypes: string[];
  acceptedExtensions: string[];
}

const imageMimeTypes = [
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
] satisfies string[];

const documentMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
] satisfies string[];

const imageExtensions = [".avif", ".gif", ".jpg", ".jpeg", ".png", ".webp"];
const documentExtensions = [
  ".doc",
  ".docx",
  ".pdf",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".txt",
];

export const storageEndpoints: Record<StorageEndpoint, StorageEndpointConfig> = {
  announcementAttachment: documentEndpoint("8MB", 8 * 1024 * 1024),
  concernAttachment: documentEndpoint("8MB", 8 * 1024 * 1024),
  editorImage: imageEndpoint("4MB", 4 * 1024 * 1024),
  eventPoster: imageEndpoint("4MB", 4 * 1024 * 1024),
  financeDocument: pdfEndpoint("16MB", 16 * 1024 * 1024),
  fundraisingCoverImage: imageEndpoint("4MB", 4 * 1024 * 1024),
  galleryImage: imageEndpoint("8MB", 8 * 1024 * 1024),
  lecturerPhoto: imageEndpoint("4MB", 4 * 1024 * 1024),
  resourceFile: documentEndpoint("16MB", 16 * 1024 * 1024),
  scholarshipAttachment: documentEndpoint("8MB", 8 * 1024 * 1024),
  spotlightPhoto: imageEndpoint("4MB", 4 * 1024 * 1024),
};

const endpointNames: StorageEndpoint[] = [
  "announcementAttachment",
  "concernAttachment",
  "editorImage",
  "eventPoster",
  "financeDocument",
  "fundraisingCoverImage",
  "galleryImage",
  "lecturerPhoto",
  "resourceFile",
  "scholarshipAttachment",
  "spotlightPhoto",
];

export function isStorageEndpoint(value: string): value is StorageEndpoint {
  return endpointNames.some((endpoint) => endpoint === value);
}

export function getStorageEndpointConfig(
  endpoint: StorageEndpoint,
): StorageEndpointConfig {
  return storageEndpoints[endpoint];
}

export function isAcceptedFile({
  name,
  mimeType,
  config,
}: {
  name: string;
  mimeType: string;
  config: StorageEndpointConfig;
}): boolean {
  const normalizedMimeType = mimeType.toLowerCase();
  const normalizedName = name.toLowerCase();
  const extensionMatches = config.acceptedExtensions.some((extension) =>
    normalizedName.endsWith(extension),
  );

  return extensionMatches && config.acceptedMimeTypes.includes(normalizedMimeType);
}

function imageEndpoint(
  maxFileSize: StorageMaxFileSize,
  maxFileSizeBytes: number,
): StorageEndpointConfig {
  return {
    kind: "image",
    maxFileSize,
    maxFileSizeBytes,
    maxFileCount: 1,
    acceptedMimeTypes: [...imageMimeTypes],
    acceptedExtensions: imageExtensions,
  };
}

function documentEndpoint(
  maxFileSize: StorageMaxFileSize,
  maxFileSizeBytes: number,
): StorageEndpointConfig {
  return {
    kind: "blob",
    maxFileSize,
    maxFileSizeBytes,
    maxFileCount: 1,
    acceptedMimeTypes: [...documentMimeTypes],
    acceptedExtensions: documentExtensions,
  };
}

function pdfEndpoint(
  maxFileSize: StorageMaxFileSize,
  maxFileSizeBytes: number,
): StorageEndpointConfig {
  return {
    kind: "blob",
    maxFileSize,
    maxFileSizeBytes,
    maxFileCount: 1,
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
  };
}
