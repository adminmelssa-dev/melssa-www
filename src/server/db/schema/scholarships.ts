import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  contentStatusEnum,
  scholarshipApplicationModeEnum,
} from "./enums";
import { timestamps } from "./helpers";
import { storageObjects } from "./storage";

export const scholarshipPrograms = pgTable(
  "scholarship_programs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull().unique(),
    providerName: varchar("provider_name", { length: 255 }).notNull(),
    summary: text("summary"),
    description: text("description").notNull(),
    status: contentStatusEnum().notNull().default("draft"),
    academicYear: varchar("academic_year", { length: 20 }),
    amountDescription: varchar("amount_description", { length: 255 }),
    eligibility: text("eligibility"),
    requirements: text("requirements"),
    applicationMode: scholarshipApplicationModeEnum("application_mode")
      .notNull()
      .default("external"),
    applicationUrl: text("application_url"),
    applicationInstructions: text("application_instructions"),
    contactEmail: varchar("contact_email", { length: 255 }),
    opensAt: timestamp("opens_at", { withTimezone: true }),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    attachmentStorageObjectId: text("attachment_storage_object_id").references(
      () => storageObjects.id,
      { onDelete: "set null" },
    ),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("scholarship_programs_status_closes_at_idx").on(
      table.status,
      table.closesAt,
    ),
    index("scholarship_programs_academic_year_idx").on(table.academicYear),
  ],
);
