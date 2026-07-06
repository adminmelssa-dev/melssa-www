import { describe, expect, test } from "bun:test";
import {
  NOTIFICATION_EVENT_DEFINITIONS,
  SITE_SETTING_DEFINITIONS,
  updateSettingsInputSchema,
} from "../../../src/modules/settings/contracts";

describe("settings contracts", () => {
  test("accepts controlled settings payloads", () => {
    const parsed = updateSettingsInputSchema.parse({
      siteSettings: [
        { key: "site_name", value: "MELSSA Student Portal" },
        { key: "contact_email", value: "melssa@example.com" },
      ],
      notificationSettings: [
        {
          eventType: "announcement.published",
          recipientEmails: ["admin@example.com"],
          recipientRoles: ["siteAdmin"],
        },
      ],
    });

    expect(parsed.siteSettings[0]?.key).toBe("site_name");
    expect(parsed.notificationSettings[0]?.recipientRoles).toContain(
      "siteAdmin",
    );
  });

  test("rejects unknown settings keys", () => {
    const parsed = updateSettingsInputSchema.safeParse({
      siteSettings: [{ key: "unknown", value: "Nope" }],
      notificationSettings: [],
    });

    expect(parsed.success).toBe(false);
  });

  test("keeps definitions available for the dashboard", () => {
    expect(SITE_SETTING_DEFINITIONS.length).toBeGreaterThan(0);
    expect(
      NOTIFICATION_EVENT_DEFINITIONS.some(
        (definition) => definition.eventType === "concern.submitted",
      ),
    ).toBe(true);
  });
});
