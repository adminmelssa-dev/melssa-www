import { index, integer, jsonb, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull().default(""),
  ...timestamps,
});

export const notificationSettings = pgTable(
  "notification_settings",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    recipientEmails: jsonb("recipient_emails").$type<string[]>().default([]),
    recipientRoles: jsonb("recipient_roles").$type<string[]>().default([]),
    ...timestamps,
  },
  (table) => [index("notification_settings_event_type_idx").on(table.eventType)],
);
