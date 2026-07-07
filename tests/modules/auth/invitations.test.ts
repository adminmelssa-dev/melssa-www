import { describe, expect, test } from "bun:test";
import {
  acceptAuthInvitationInputSchema,
  adminInvitationMutationSchema,
  adminUserMutationSchema,
  inviteAdminUserInputSchema,
  permissionGrantSchema,
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

  test("accepts bounded direct permission grants", () => {
    const parsed = permissionGrantSchema.parse({
      resource: "fundraising",
      action: "respond",
    });

    expect(parsed.resource).toBe("fundraising");
    expect(parsed.action).toBe("respond");
    expect(
      permissionGrantSchema.safeParse({
        resource: "scholarship",
        action: "respond",
      }).success,
    ).toBe(false);
  });

  test("accepts admin user permission mutations", () => {
    const parsed = adminUserMutationSchema.parse({
      type: "permission",
      payload: {
        userId: "user_123",
        resource: "finance",
        action: "publish",
        intent: "grant",
      },
    });

    expect(parsed.type).toBe("permission");
  });
});
