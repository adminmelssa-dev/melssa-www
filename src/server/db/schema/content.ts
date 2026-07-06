import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  announcementCategoryEnum,
  contentStatusEnum,
  eventStatusEnum,
  galleryItemTypeEnum,
} from "./enums";
import { storageObjects } from "./storage";
import { timestamps } from "./helpers";

export const announcements = pgTable(
  "announcements",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 255 }).notNull(),
    summary: text("summary"),
    body: text("body").notNull(),
    category: announcementCategoryEnum().notNull().default("general"),
    status: contentStatusEnum().notNull().default("draft"),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    attachmentStorageObjectId: text("attachment_storage_object_id").references(
      () => storageObjects.id,
      { onDelete: "set null" },
    ),
    publishedAt: timestamp("published_at"),
    ...timestamps,
  },
  (table) => [
    index("announcements_status_published_at_idx").on(
      table.status,
      table.publishedAt,
    ),
    index("announcements_category_idx").on(table.category),
  ],
);

export const events = pgTable(
  "events",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    location: varchar("location", { length: 255 }),
    status: eventStatusEnum().notNull().default("draft"),
    posterStorageObjectId: text("poster_storage_object_id").references(
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
    index("events_status_starts_at_idx").on(table.status, table.startsAt),
    index("events_created_by_idx").on(table.createdById),
  ],
);

export const galleryItems = pgTable(
  "gallery_items",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 255 }).notNull(),
    caption: text("caption"),
    type: galleryItemTypeEnum().notNull().default("other"),
    storageObjectId: text("storage_object_id")
      .notNull()
      .references(() => storageObjects.id, { onDelete: "cascade" }),
    isFeatured: boolean("is_featured").notNull().default(false),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    index("gallery_items_type_idx").on(table.type),
    index("gallery_items_featured_idx").on(table.isFeatured),
  ],
);

export const studentSpotlights = pgTable(
  "student_spotlights",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    studentName: varchar("student_name", { length: 255 }).notNull(),
    headline: varchar("headline", { length: 255 }).notNull(),
    body: text("body").notNull(),
    status: contentStatusEnum().notNull().default("draft"),
    photoStorageObjectId: text("photo_storage_object_id").references(
      () => storageObjects.id,
      { onDelete: "set null" },
    ),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    index("student_spotlights_status_published_at_idx").on(
      table.status,
      table.publishedAt,
    ),
  ],
);
