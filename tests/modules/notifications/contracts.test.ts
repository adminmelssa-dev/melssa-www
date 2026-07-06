import { describe, expect, test } from "bun:test";
import {
  dashboardNotificationMutationSchema,
  dashboardNotificationsResponseSchema,
} from "../../../src/modules/notifications/contracts";

describe("notification contracts", () => {
  test("accepts dashboard notification responses", () => {
    const parsed = dashboardNotificationsResponseSchema.parse({
      notifications: [
        {
          id: 1,
          type: "bulletin.delivery.sent",
          title: "Bulletin sent",
          body: "Week 7 bulletin was sent to 42 subscribers.",
          href: "/dashboard/bulletins",
          readAt: null,
          createdAt: "2026-07-06T20:00:00.000Z",
        },
      ],
      unreadCount: 1,
    });

    expect(parsed.notifications[0]?.href).toBe("/dashboard/bulletins");
    expect(parsed.unreadCount).toBe(1);
  });

  test("accepts read mutations and rejects invalid ids", () => {
    const markRead = dashboardNotificationMutationSchema.parse({
      type: "read",
      notificationId: 10,
    });
    const invalidRead = dashboardNotificationMutationSchema.safeParse({
      type: "read",
      notificationId: 0,
    });
    const markAllRead = dashboardNotificationMutationSchema.parse({
      type: "read-all",
    });

    expect(markRead.type).toBe("read");
    expect(invalidRead.success).toBe(false);
    expect(markAllRead.type).toBe("read-all");
  });
});
