import { describe, expect, test } from "bun:test";
import {
  ACADEMIC_LEVEL_LABELS,
  SEMESTER_TERM_LABELS,
  createCourseInputSchema,
} from "../../../src/modules/academics/contracts";

describe("academic course contracts", () => {
  test("normalizes course codes and empty descriptions", () => {
    const parsed = createCourseInputSchema.parse({
      code: "  mels   101 ",
      title: "  Human Anatomy  ",
      level: "level100",
      semester: "first",
      description: "   ",
    });

    expect(parsed.code).toBe("MELS 101");
    expect(parsed.title).toBe("Human Anatomy");
    expect(parsed.description).toBeNull();
  });

  test("rejects unsupported levels and semesters", () => {
    const parsed = createCourseInputSchema.safeParse({
      code: "MELS 101",
      title: "Human Anatomy",
      level: "level500",
      semester: "third",
      description: null,
    });

    expect(parsed.success).toBe(false);
  });

  test("keeps labels available for catalog filters", () => {
    expect(ACADEMIC_LEVEL_LABELS.level100).toBe("Level 100");
    expect(ACADEMIC_LEVEL_LABELS.level400).toBe("Level 400");
    expect(SEMESTER_TERM_LABELS.first).toBe("First Semester");
    expect(SEMESTER_TERM_LABELS.second).toBe("Second Semester");
  });
});
