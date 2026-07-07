import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  contentStatusEnum,
  financeDocumentTypeEnum,
  semesterTermEnum,
} from "./enums";
import { timestamps } from "./helpers";
import { storageObjects } from "./storage";

export const financeDocuments = pgTable(
  "finance_documents",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 255 }).notNull(),
    summary: text("summary"),
    type: financeDocumentTypeEnum().notNull(),
    status: contentStatusEnum().notNull().default("draft"),
    academicYear: varchar("academic_year", { length: 20 }).notNull(),
    semester: semesterTermEnum("semester"),
    programmeName: varchar("programme_name", { length: 255 }),
    datePresented: timestamp("date_presented", { withTimezone: true }),
    storageObjectId: text("storage_object_id").references(() => storageObjects.id, {
      onDelete: "set null",
    }),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("finance_documents_storage_object_unique").on(table.storageObjectId),
    index("finance_documents_status_published_at_idx").on(
      table.status,
      table.publishedAt,
    ),
    index("finance_documents_type_year_idx").on(table.type, table.academicYear),
  ],
);
