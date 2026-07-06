import { describe, expect, test } from "bun:test";
import {
  getNextContentPublishedAt,
  getNextEventPublishedAt,
} from "../../../src/modules/content/contracts";

describe("content contracts", () => {
  test("clears content published dates when content leaves published state", () => {
    const currentPublishedAt = new Date("2026-01-01T10:00:00.000Z");

    const nextPublishedAt = getNextContentPublishedAt({
      currentPublishedAt,
      nextStatus: "archived",
      previousStatus: "published",
    });

    expect(nextPublishedAt).toBeNull();
  });

  test("preserves content published dates while content remains published", () => {
    const currentPublishedAt = new Date("2026-01-01T10:00:00.000Z");

    const nextPublishedAt = getNextContentPublishedAt({
      currentPublishedAt,
      nextStatus: "published",
      previousStatus: "published",
    });

    expect(nextPublishedAt).toBe(currentPublishedAt);
  });

  test("sets event published dates when events become published", () => {
    const nextPublishedAt = getNextEventPublishedAt({
      currentPublishedAt: null,
      nextStatus: "published",
      previousStatus: "draft",
    });

    expect(nextPublishedAt).toBeInstanceOf(Date);
  });
});
