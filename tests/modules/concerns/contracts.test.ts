import { describe, expect, test } from "bun:test";
import {
  CONCERN_CATEGORY_LABELS,
  CONCERN_STATUS_LABELS,
  createConcernInputSchema,
  updateConcernInputSchema,
} from "../../../src/modules/concerns/contracts";

describe("concern contracts", () => {
  test("normalizes anonymous concern submissions", () => {
    const parsed = createConcernInputSchema.parse({
      category: "welfare",
      subject: "  Hostel water issue  ",
      message:
        "  The hostel has had no running water for several days this week.  ",
      attachmentStorageObjectId: undefined,
    });

    expect(parsed.category).toBe("welfare");
    expect(parsed.subject).toBe("Hostel water issue");
    expect(parsed.message).toBe(
      "The hostel has had no running water for several days this week.",
    );
    expect(parsed.attachmentStorageObjectId).toBeNull();
  });

  test("normalizes empty internal notes", () => {
    const parsed = updateConcernInputSchema.parse({
      concernId: 1,
      status: "reviewing",
      internalNote: "   ",
    });

    expect(parsed.internalNote).toBeNull();
  });

  test("keeps concern labels available for filters", () => {
    expect(CONCERN_CATEGORY_LABELS.harassment).toBe("Harassment");
    expect(CONCERN_CATEGORY_LABELS.facilities).toBe("Facilities");
    expect(CONCERN_STATUS_LABELS.resolved).toBe("Resolved");
  });
});
