import { describe, expect, test } from "bun:test";
import {
  ANNOUNCEMENT_CATEGORY_LABELS,
  CONTENT_STATUS_LABELS,
  createAnnouncementInputSchema,
} from "../../../src/modules/announcements/contracts";

describe("announcement contracts", () => {
  test("normalizes optional announcement fields", () => {
    const parsed = createAnnouncementInputSchema.parse({
      title: "  Congress update  ",
      summary: "   ",
      body: "  Registration opens at the department office.  ",
      category: "academic",
      status: "published",
      attachmentStorageObjectId: undefined,
    });

    expect(parsed.title).toBe("Congress update");
    expect(parsed.summary).toBeNull();
    expect(parsed.body).toBe("Registration opens at the department office.");
    expect(parsed.attachmentStorageObjectId).toBeNull();
  });

  test("rejects short announcement bodies", () => {
    const parsed = createAnnouncementInputSchema.safeParse({
      title: "Update",
      summary: null,
      body: "short",
      category: "general",
      status: "draft",
      attachmentStorageObjectId: null,
    });

    expect(parsed.success).toBe(false);
  });

  test("keeps labels available for announcement filters", () => {
    expect(ANNOUNCEMENT_CATEGORY_LABELS.academic).toBe("Academic");
    expect(ANNOUNCEMENT_CATEGORY_LABELS.welfare).toBe("Welfare");
    expect(CONTENT_STATUS_LABELS.published).toBe("Published");
  });
});
