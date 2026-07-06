import { describe, expect, test } from "bun:test";
import {
  BULLETIN_SECTION_CATEGORY_LABELS,
  createBulletinIssueInputSchema,
  subscribeToBulletinInputSchema,
} from "../../../src/modules/bulletin/contracts";

describe("bulletin contracts", () => {
  test("normalizes footer subscription emails", () => {
    const parsed = subscribeToBulletinInputSchema.parse({
      email: "  Student@ATU.EDU.GH ",
    });

    expect(parsed.email).toBe("student@atu.edu.gh");
    expect(parsed.source).toBe("footer");
  });

  test("rejects invalid subscription sources", () => {
    const parsed = subscribeToBulletinInputSchema.safeParse({
      email: "student@atu.edu.gh",
      source: "",
    });

    expect(parsed.success).toBe(false);
  });

  test("accepts rich bulletin issue payloads", () => {
    const parsed = createBulletinIssueInputSchema.parse({
      title: "Week 7 practical brief",
      subject: "MELSSA Weekly Bulletin: Week 7 practical brief",
      previewText: "Practicals, events, and resources for the week.",
      editorNote:
        "This week brings several academic reminders and association updates for students.",
      sections: [
        {
          heading: "Practical schedule reminders",
          body: "Level 300 students should review the updated practical schedule before Friday.",
          category: "academic",
        },
      ],
      audienceTags: ["level300", "practicals", "level300"],
    });

    expect(parsed.sections[0]?.category).toBe("academic");
    expect(parsed.audienceTags).toEqual(["level300", "practicals", "level300"]);
  });

  test("rejects weak bulletin sections and noisy tags", () => {
    const parsed = createBulletinIssueInputSchema.safeParse({
      title: "Brief",
      subject: "Weekly brief",
      previewText: "",
      editorNote:
        "This note is long enough for the editor note validation to pass.",
      sections: [
        {
          heading: "Hi",
          body: "Too short.",
          category: "academic",
        },
      ],
      audienceTags: ["Level 300"],
    });

    expect(parsed.success).toBe(false);
  });

  test("keeps section labels available for email rendering", () => {
    expect(BULLETIN_SECTION_CATEGORY_LABELS.academic).toBe("Academic");
    expect(BULLETIN_SECTION_CATEGORY_LABELS.resources).toBe("Resources");
  });
});
