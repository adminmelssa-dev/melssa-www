import { describe, expect, test } from "bun:test";
import {
  STORAGE_ENDPOINT_LABELS,
  STORAGE_OBJECT_STATUS_LABELS,
  storageObjectRowSchema,
} from "../../../src/modules/storage/contracts";

describe("storage contracts", () => {
  test("accepts completed storage object rows", () => {
    const parsed = storageObjectRowSchema.parse({
      id: "storage_123",
      provider: "uploadthing",
      providerObjectId: "provider_123",
      objectKey: "files/resource.pdf",
      publicUrl: "https://ufs.sh/f/resource.pdf",
      originalFilename: "resource.pdf",
      mimeType: "application/pdf",
      byteSize: 1200,
      fileHash: null,
      endpoint: "resourceFile",
      status: "completed",
      uploadedBy: null,
      completedAt: "2026-07-06T12:00:00.000Z",
      deletedAt: null,
      createdAt: "2026-07-06T12:00:00.000Z",
      updatedAt: "2026-07-06T12:00:00.000Z",
    });

    expect(parsed.endpoint).toBe("resourceFile");
    expect(parsed.status).toBe("completed");
  });

  test("keeps storage labels available for filters", () => {
    expect(STORAGE_ENDPOINT_LABELS.galleryImage).toBe("Gallery Image");
    expect(STORAGE_ENDPOINT_LABELS.spotlightPhoto).toBe("Spotlight Photo");
    expect(STORAGE_OBJECT_STATUS_LABELS.deleted).toBe("Deleted");
  });
});
