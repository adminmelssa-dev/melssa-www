import { describe, expect, test } from "bun:test";
import {
  CONTENT_STATUS_LABELS,
  RESOURCE_TYPE_LABELS,
  createResourceInputSchema,
  updateResourceInputSchema,
} from "../../../src/modules/resources/contracts";

describe("resource contracts", () => {
  test("normalizes optional metadata", () => {
    const parsed = createResourceInputSchema.parse({
      title: "  Anatomy Slides  ",
      description: "   ",
      type: "lecture_slide",
      level: "level100",
      semester: "first",
      academicYear: " 2025/2026 ",
      courseId: undefined,
      storageObjectId: "storage_123",
      status: "published",
    });

    expect(parsed.title).toBe("Anatomy Slides");
    expect(parsed.description).toBeNull();
    expect(parsed.academicYear).toBe("2025/2026");
    expect(parsed.courseId).toBeNull();
  });

  test("requires a storage object when creating a resource", () => {
    const parsed = createResourceInputSchema.safeParse({
      title: "Anatomy Slides",
      description: null,
      type: "lecture_slide",
      level: "level100",
      semester: "first",
      academicYear: null,
      courseId: null,
      storageObjectId: "",
      status: "draft",
    });

    expect(parsed.success).toBe(false);
  });

  test("does not accept storage replacement in update payloads", () => {
    const parsed = updateResourceInputSchema.parse({
      resourceId: 1,
      title: "Anatomy Slides",
      description: null,
      type: "lecture_slide",
      level: "level100",
      semester: "first",
      academicYear: null,
      courseId: null,
      storageObjectId: "ignored",
      status: "draft",
    });

    expect(parsed).not.toHaveProperty("storageObjectId");
  });

  test("keeps labels available for admin filters", () => {
    expect(RESOURCE_TYPE_LABELS.lecture_slide).toBe("Lecture Slide");
    expect(RESOURCE_TYPE_LABELS.past_question).toBe("Past Question");
    expect(CONTENT_STATUS_LABELS.published).toBe("Published");
    expect(CONTENT_STATUS_LABELS.archived).toBe("Archived");
  });
});
