import {
  integer,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  bulletinDeliveryStatusEnum,
  bulletinIssueStatusEnum,
} from "./enums";
import { timestamps } from "./helpers";

export type BulletinSectionCategory =
  | "academic"
  | "association"
  | "events"
  | "resources"
  | "opportunities"
  | "reminder";

export interface BulletinIssueSection {
  heading: string;
  body: string;
  category: BulletinSectionCategory;
}

export const bulletinSubscriptions = pgTable(
  "bulletin_subscriptions",
  {
    id: text("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    source: varchar("source", { length: 80 }).notNull().default("footer"),
    confirmedAt: timestamp("confirmed_at"),
    unsubscribedAt: timestamp("unsubscribed_at"),
    lastSubscribedAt: timestamp("last_subscribed_at").notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    index("bulletin_subscriptions_unsubscribed_at_idx").on(
      table.unsubscribedAt,
    ),
    uniqueIndex("bulletin_subscriptions_email_unique").on(table.email),
  ],
);

export const bulletinIssues = pgTable(
  "bulletin_issues",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 180 }).notNull(),
    previewText: varchar("preview_text", { length: 255 }),
    editorNote: text("editor_note").notNull(),
    sections: jsonb("sections").$type<BulletinIssueSection[]>().notNull(),
    audienceTags: jsonb("audience_tags").$type<string[]>().notNull().default([]),
    status: bulletinIssueStatusEnum().notNull().default("draft"),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedById: text("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    sentById: text("sent_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    sentAt: timestamp("sent_at"),
    archivedAt: timestamp("archived_at"),
    recipientCount: integer("recipient_count").notNull().default(0),
    deliverySuccessCount: integer("delivery_success_count").notNull().default(0),
    deliveryFailureCount: integer("delivery_failure_count").notNull().default(0),
    lastDeliveryError: text("last_delivery_error"),
    ...timestamps,
  },
  (table) => [
    index("bulletin_issues_status_created_at_idx").on(
      table.status,
      table.createdAt,
    ),
    index("bulletin_issues_sent_at_idx").on(table.sentAt),
    index("bulletin_issues_created_by_id_idx").on(table.createdById),
    index("bulletin_issues_updated_by_id_idx").on(table.updatedById),
    index("bulletin_issues_sent_by_id_idx").on(table.sentById),
  ],
);

export const bulletinDeliveries = pgTable(
  "bulletin_deliveries",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    issueId: integer("issue_id")
      .notNull()
      .references(() => bulletinIssues.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id").references(
      () => bulletinSubscriptions.id,
      { onDelete: "set null" },
    ),
    email: varchar("email", { length: 255 }).notNull(),
    status: bulletinDeliveryStatusEnum().notNull(),
    provider: varchar("provider", { length: 40 }),
    messageId: text("message_id"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("bulletin_deliveries_issue_id_idx").on(table.issueId),
    index("bulletin_deliveries_subscription_id_idx").on(table.subscriptionId),
    index("bulletin_deliveries_status_idx").on(table.status),
    index("bulletin_deliveries_email_idx").on(table.email),
  ],
);
