import { describe, expect, test } from "bun:test";
import {
  adminAuditLogsResponseSchema,
  auditLogRowSchema,
} from "../../../src/modules/audit/contracts";

describe("audit contracts", () => {
  test("accepts audit rows with actor and metadata", () => {
    const parsed = auditLogRowSchema.parse({
      id: 1,
      actor: {
        id: "user_1",
        name: "Admin User",
        email: "admin@example.com",
      },
      action: "settings.update",
      entityType: "settings",
      entityId: null,
      summary: "Updated portal settings.",
      metadata: {
        previousRole: "student",
        nextRole: "siteAdmin",
        changed: true,
        count: 2,
        empty: null,
      },
      createdAt: new Date("2026-07-06T12:00:00.000Z").toISOString(),
    });

    expect(parsed.actor?.email).toBe("admin@example.com");
    expect(parsed.metadata.changed).toBe(true);
  });

  test("accepts system audit rows", () => {
    const parsed = adminAuditLogsResponseSchema.parse({
      auditLogs: [
        {
          id: 2,
          actor: null,
          action: "concern.submit",
          entityType: "anonymous_concern",
          entityId: "12",
          summary: "Submitted anonymous concern.",
          metadata: {},
          createdAt: new Date("2026-07-06T12:00:00.000Z").toISOString(),
        },
      ],
    });

    expect(parsed.auditLogs[0]?.actor).toBeNull();
  });

  test("rejects nested metadata objects", () => {
    const result = auditLogRowSchema.safeParse({
      id: 3,
      actor: null,
      action: "user.role.update",
      entityType: "user",
      entityId: "user_1",
      summary: "Changed a role.",
      metadata: {
        nested: { value: "unsupported" },
      },
      createdAt: new Date("2026-07-06T12:00:00.000Z").toISOString(),
    });

    expect(result.success).toBe(false);
  });
});
