import { describe, expect, test } from "bun:test";
import {
  EVENT_STATUS_LABELS,
  createEventInputSchema,
} from "../../../src/modules/events/contracts";

describe("event contracts", () => {
  test("normalizes optional event fields", () => {
    const parsed = createEventInputSchema.parse({
      title: "  Skills workshop  ",
      description: "   ",
      startsAt: "2026-08-01T09:30",
      endsAt: "",
      location: "  Lecture theatre 2  ",
      status: "published",
      posterStorageObjectId: undefined,
    });

    expect(parsed.title).toBe("Skills workshop");
    expect(parsed.description).toBeNull();
    expect(Number.isNaN(new Date(parsed.startsAt).getTime())).toBe(false);
    expect(parsed.endsAt).toBeNull();
    expect(parsed.location).toBe("Lecture theatre 2");
    expect(parsed.posterStorageObjectId).toBeNull();
  });

  test("rejects event end times that are before the start", () => {
    const parsed = createEventInputSchema.safeParse({
      title: "Skills workshop",
      description: null,
      startsAt: "2026-08-01T09:30",
      endsAt: "2026-08-01T08:30",
      location: null,
      status: "draft",
      posterStorageObjectId: null,
    });

    expect(parsed.success).toBe(false);
  });

  test("keeps labels available for event filters", () => {
    expect(EVENT_STATUS_LABELS.draft).toBe("Draft");
    expect(EVENT_STATUS_LABELS.published).toBe("Published");
    expect(EVENT_STATUS_LABELS.cancelled).toBe("Cancelled");
  });
});
