import { describe, expect, test } from "bun:test";
import {
  passkeyListItemSchema,
  profileSessionMutationSchema,
  sessionListItemSchema,
} from "../../../src/modules/profile/contracts";

describe("profile contracts", () => {
  test("accepts passkey list items", () => {
    const parsed = passkeyListItemSchema.parse({
      id: "pk_123",
      label: "Touch ID",
      deviceType: "singleDevice",
      backedUp: false,
      createdAtLabel: "Jul 6, 2026",
    });

    expect(parsed.label).toBe("Touch ID");
  });

  test("allows unknown device type labels from providers", () => {
    const parsed = passkeyListItemSchema.parse({
      id: "pk_456",
      label: "Security Key",
      deviceType: null,
      backedUp: true,
      createdAtLabel: "Jul 6, 2026",
    });

    expect(parsed.deviceType).toBeNull();
  });

  test("accepts sanitized session list items", () => {
    const parsed = sessionListItemSchema.parse({
      id: "session_123",
      deviceLabel: "Safari on macOS",
      ipAddress: "127.0.0.1",
      isCurrent: true,
      createdAtLabel: "Jul 6, 2026",
      lastActiveAtLabel: "Jul 6, 2026",
      expiresAtLabel: "Aug 5, 2026",
    });

    expect(parsed.isCurrent).toBe(true);
  });

  test("accepts profile session mutation intents", () => {
    const revokeParsed = profileSessionMutationSchema.parse({
      intent: "revoke",
      sessionId: "session_123",
    });
    const revokeOtherParsed = profileSessionMutationSchema.parse({
      intent: "revokeOther",
    });

    expect(revokeParsed.intent).toBe("revoke");
    expect(revokeOtherParsed.intent).toBe("revokeOther");
  });
});
