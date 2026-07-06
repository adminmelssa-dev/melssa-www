import { describe, expect, test } from "bun:test";
import { createLecturerInputSchema } from "../../../src/modules/lecturers/contracts";

describe("lecturer contracts", () => {
  test("normalizes optional profile fields", () => {
    const parsed = createLecturerInputSchema.parse({
      name: "  Dr. Jane Doe  ",
      title: "  Senior Lecturer  ",
      email: "JANE.DOE@EXAMPLE.EDU",
      phone: "   ",
      officeLocation: null,
      officeHours: undefined,
      photoStorageObjectId: undefined,
      courseIds: [3, 3, 4],
    });

    expect(parsed.name).toBe("Dr. Jane Doe");
    expect(parsed.title).toBe("Senior Lecturer");
    expect(parsed.email).toBe("jane.doe@example.edu");
    expect(parsed.phone).toBeNull();
    expect(parsed.officeLocation).toBeNull();
    expect(parsed.officeHours).toBeNull();
    expect(parsed.photoStorageObjectId).toBeNull();
    expect(parsed.courseIds).toEqual([3, 3, 4]);
  });

  test("rejects invalid emails", () => {
    const parsed = createLecturerInputSchema.safeParse({
      name: "Dr. Jane Doe",
      title: "",
      email: "not-an-email",
      phone: "",
      officeLocation: "",
      officeHours: "",
      photoStorageObjectId: null,
      courseIds: [],
    });

    expect(parsed.success).toBe(false);
  });
});
