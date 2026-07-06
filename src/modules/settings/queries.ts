import "server-only";

import { asc } from "drizzle-orm";
import {
  NOTIFICATION_EVENT_DEFINITIONS,
  SITE_SETTING_DEFINITIONS,
  type AdminSettingsResponse,
  type NotificationEventType,
  type NotificationSettingRow,
  type SiteSettingKey,
  type SiteSettingRow,
} from "@/modules/settings/contracts";
import { userRoleSchema } from "@/modules/auth/contracts";
import type { UserRole } from "@/modules/auth/roles";
import { db } from "@/server/db";
import {
  notificationSettings,
  siteSettings,
} from "@/server/db/schema";

export async function getAdminSettings(): Promise<AdminSettingsResponse> {
  const [siteRows, notificationRows] = await Promise.all([
    db.select().from(siteSettings).orderBy(asc(siteSettings.key)),
    db
      .select()
      .from(notificationSettings)
      .orderBy(asc(notificationSettings.eventType)),
  ]);

  const siteValueByKey = new Map<SiteSettingKey, string>();
  for (const row of siteRows) {
    const definition = SITE_SETTING_DEFINITIONS.find(
      (item) => item.key === row.key,
    );
    if (definition) siteValueByKey.set(definition.key, row.value);
  }

  const notificationByEventType = new Map<
    NotificationEventType,
    {
      recipientEmails: string[];
      recipientRoles: string[];
    }
  >();
  for (const row of notificationRows) {
    const definition = NOTIFICATION_EVENT_DEFINITIONS.find(
      (item) => item.eventType === row.eventType,
    );
    if (!definition) continue;

    notificationByEventType.set(definition.eventType, {
      recipientEmails: row.recipientEmails ?? [],
      recipientRoles: row.recipientRoles ?? [],
    });
  }

  return {
    siteSettings: SITE_SETTING_DEFINITIONS.map<SiteSettingRow>((definition) => ({
      key: definition.key,
      label: definition.label,
      description: definition.description,
      value: siteValueByKey.get(definition.key) ?? definition.defaultValue,
      multiline: definition.multiline,
      maxLength: definition.maxLength,
    })),
    notificationSettings:
      NOTIFICATION_EVENT_DEFINITIONS.map<NotificationSettingRow>(
        (definition) => {
          const row = notificationByEventType.get(definition.eventType);
          return {
            eventType: definition.eventType,
            label: definition.label,
            description: definition.description,
            recipientEmails: row?.recipientEmails ?? [],
            recipientRoles: row
              ? normalizeRecipientRoles(row.recipientRoles)
              : definition.defaultRoles,
          };
        },
      ),
  };
}

function normalizeRecipientRoles(values: string[]): UserRole[] {
  const roles: UserRole[] = [];

  for (const value of values) {
    const parsedRole = userRoleSchema.safeParse(value);
    if (parsedRole.success) roles.push(parsedRole.data);
  }

  return roles;
}
