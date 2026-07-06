import {
  describe,
  expect,
  it,
} from "bun:test";
import {
  ExpectedError,
  errorResult,
} from "@/lib/action-result";

describe("action results", () => {
  it("exposes expected error messages", () => {
    expect(errorResult(new ExpectedError("Use this message."), "Fallback.")).toEqual({
      ok: false,
      message: "Use this message.",
    });
  });

  it("hides unexpected error messages behind the fallback", () => {
    expect(errorResult(new Error("Database password leaked."), "Fallback.")).toEqual({
      ok: false,
      message: "Fallback.",
    });
  });
});
