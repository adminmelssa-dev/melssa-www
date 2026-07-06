import "server-only";

import { revalidatePath } from "next/cache";
import { inArray } from "drizzle-orm";
import {
  NOTIFICATION_EVENT_DEFINITIONS,
  SITE_SETTING_DEFINITIONS,
  type NotificationEventType,
  type SiteSettingKey,
  type UpdateSettingsInput,
} from "@/modules/settings/contracts";
import { writeAuditLog } from "@/server/audit/log";
import { db } from "@/server/db";
import {
  notificationSettings,
  siteSettings,
} from "@/server/db/schema";

const siteSettingKeys = SITE_SETTING_DEFINITIONS.map(
  (definition) => definition.key,
);

const notificationEventTypes = NOTIFICATION_EVENT_DEFINITIONS.map(
  (definition) => definition.eventType,
);

export async function updateAdminSettings({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateSettingsInput;
}): Promise<void> {
  const nextSiteSettingByKey = new Map<SiteSettingKey, string>();
  for (const definition of SITE_SETTING_DEFINITIONS) {
    nextSiteSettingByKey.set(definition.key, definition.defaultValue);
  }
  for (const setting of input.siteSettings) {
    nextSiteSettingByKey.set(setting.key, setting.value);
  }

  for (const definition of SITE_SETTING_DEFINITIONS) {
    const value =
      nextSiteSettingByKey.get(definition.key) ?? definition.defaultValue;

    const [existing] = await db
      .select({ id: siteSettings.id })
      .from(siteSettings)
      .where(inArray(siteSettings.key, [definition.key]))
      .limit(1);

    if (existing) {
      await db
        .update(siteSettings)
        .set({ value, updatedAt: new Date() })
        .where(inArray(siteSettings.key, [definition.key]));
    } else {
      await db.insert(siteSettings).values({
        key: definition.key,
        value,
      });
    }
  }

  const notificationByEventType = new Map<
    NotificationEventType,
    UpdateSettingsInput["notificationSettings"][number]
  >();
  for (const notificationSetting of input.notificationSettings) {
    notificationByEventType.set(
      notificationSetting.eventType,
      notificationSetting,
    );
  }

  await db
    .delete(notificationSettings)
    .where(inArray(notificationSettings.eventType, notificationEventTypes));

  await db.insert(notificationSettings).values(
    NOTIFICATION_EVENT_DEFINITIONS.map((definition) => {
      const setting = notificationByEventType.get(definition.eventType);
      return {
        eventType: definition.eventType,
        recipientEmails: setting?.recipientEmails ?? [],
        recipientRoles: setting?.recipientRoles ?? definition.defaultRoles,
      };
    }),
  );

  await writeAuditLog({
    actorUserId,
    action: "settings.update",
    entityType: "settings",
    summary: "Updated portal settings.",
    metadata: {
      siteSettingCount: siteSettingKeys.length,
      notificationSettingCount: notificationEventTypes.length,
    },
  });

  revalidatePath("/");
  revalidatePath("/dashboard/settings");
}
