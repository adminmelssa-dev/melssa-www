import { describe, expect, test } from "bun:test";
import {
  CONTENT_STATUS_LABELS,
  createSpotlightInputSchema,
} from "../../../src/modules/spotlights/contracts";

describe("spotlight contracts", () => {
  test("normalizes spotlight fields", () => {
    const parsed = createSpotlightInputSchema.parse({
      studentName: "  Ada Student  ",
      headline: "  Research presentation winner  ",
      body:
        "  Ada represented the department with a strong research presentation.  ",
      status: "published",
      photoStorageObjectId: undefined,
    });

    expect(parsed.studentName).toBe("Ada Student");
    expect(parsed.headline).toBe("Research presentation winner");
    expect(parsed.body).toBe(
      "Ada represented the department with a strong research presentation.",
    );
    expect(parsed.photoStorageObjectId).toBeNull();
  });

  test("rejects short spotlight stories", () => {
    const parsed = createSpotlightInputSchema.safeParse({
      studentName: "Ada Student",
      headline: "Winner",
      body: "Too short",
      status: "draft",
      photoStorageObjectId: null,
    });

    expect(parsed.success).toBe(false);
  });

  test("keeps content status labels available", () => {
    expect(CONTENT_STATUS_LABELS.draft).toBe("Draft");
    expect(CONTENT_STATUS_LABELS.published).toBe("Published");
    expect(CONTENT_STATUS_LABELS.archived).toBe("Archived");
  });
});
