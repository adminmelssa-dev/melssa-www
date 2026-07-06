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
import { courses } from "./academics";
import {
  academicLevelEnum,
  contentStatusEnum,
  resourceTypeEnum,
  semesterTermEnum,
} from "./enums";
import { storageObjects } from "./storage";
import { timestamps } from "./helpers";

export const resources = pgTable(
  "resources",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    type: resourceTypeEnum().notNull(),
    level: academicLevelEnum().notNull(),
    semester: semesterTermEnum().notNull(),
    academicYear: varchar("academic_year", { length: 20 }),
    courseId: integer("course_id").references(() => courses.id, {
      onDelete: "set null",
    }),
    storageObjectId: text("storage_object_id")
      .notNull()
      .references(() => storageObjects.id, { onDelete: "cascade" }),
    status: contentStatusEnum().notNull().default("draft"),
    uploadedByUserId: text("uploaded_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("resources_storage_object_unique").on(table.storageObjectId),
    index("resources_type_level_semester_idx").on(
      table.type,
      table.level,
      table.semester,
    ),
    index("resources_course_idx").on(table.courseId),
    index("resources_status_idx").on(table.status),
  ],
);
