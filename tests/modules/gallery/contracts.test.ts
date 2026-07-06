import { describe, expect, test } from "bun:test";
import {
  GALLERY_ITEM_TYPE_LABELS,
  createGalleryItemInputSchema,
} from "../../../src/modules/gallery/contracts";

describe("gallery contracts", () => {
  test("normalizes gallery metadata", () => {
    const parsed = createGalleryItemInputSchema.parse({
      title: "  Health screening outreach  ",
      caption: "   ",
      type: "health_screening",
      storageObjectId: "storage_123",
      isFeatured: true,
      capturedAt: "2026-08-10",
    });

    expect(parsed.title).toBe("Health screening outreach");
    expect(parsed.caption).toBeNull();
    expect(parsed.type).toBe("health_screening");
    expect(parsed.isFeatured).toBe(true);
    expect(Number.isNaN(new Date(parsed.capturedAt ?? "").getTime())).toBe(
      false,
    );
  });

  test("requires an uploaded image", () => {
    const parsed = createGalleryItemInputSchema.safeParse({
      title: "Health screening outreach",
      caption: null,
      type: "outreach",
      storageObjectId: "",
      isFeatured: false,
      capturedAt: null,
    });

    expect(parsed.success).toBe(false);
  });

  test("keeps gallery labels available for filters", () => {
    expect(GALLERY_ITEM_TYPE_LABELS.congress).toBe("Congress");
    expect(GALLERY_ITEM_TYPE_LABELS.health_screening).toBe(
      "Health Screening",
    );
  });
});
