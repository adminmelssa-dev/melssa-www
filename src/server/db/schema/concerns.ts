import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { concernCategoryEnum, concernStatusEnum } from "./enums";
import { storageObjects } from "./storage";
import { timestamps } from "./helpers";

export const anonymousConcerns = pgTable(
  "anonymous_concerns",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    category: concernCategoryEnum().notNull().default("other"),
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),
    status: concernStatusEnum().notNull().default("new"),
    attachmentStorageObjectId: text("attachment_storage_object_id").references(
      () => storageObjects.id,
      { onDelete: "set null" },
    ),
    reviewedByUserId: text("reviewed_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    internalNote: text("internal_note"),
    ...timestamps,
  },
  (table) => [
    index("anonymous_concerns_status_created_at_idx").on(
      table.status,
      table.createdAt,
    ),
    index("anonymous_concerns_category_idx").on(table.category),
  ],
);
