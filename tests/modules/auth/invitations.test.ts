import { describe, expect, test } from "bun:test";
import {
  acceptAuthInvitationInputSchema,
  adminInvitationMutationSchema,
  inviteAdminUserInputSchema,
} from "../../../src/modules/auth/contracts";
import { ROLES } from "../../../src/modules/auth/roles";

describe("auth invitation contracts", () => {
  test("normalizes invited email addresses", () => {
    const parsed = inviteAdminUserInputSchema.parse({
      email: "  Content.Admin@Example.COM  ",
      role: ROLES.CONTENT_ADMIN,
    });

    expect(parsed.email).toBe("content.admin@example.com");
    expect(parsed.role).toBe(ROLES.CONTENT_ADMIN);
  });

  test("rejects malformed invitation mutations", () => {
    const parsed = adminInvitationMutationSchema.safeParse({
      type: "resend",
      invitationId: "",
    });

    expect(parsed.success).toBe(false);
  });

  test("requires bounded invitation tokens", () => {
    expect(
      acceptAuthInvitationInputSchema.safeParse({ token: "short" }).success,
    ).toBe(false);
    expect(
      acceptAuthInvitationInputSchema.safeParse({
        token: "a".repeat(64),
      }).success,
    ).toBe(true);
  });
});
