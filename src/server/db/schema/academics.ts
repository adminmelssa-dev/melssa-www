import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { academicLevelEnum, semesterTermEnum } from "./enums";
import { storageObjects } from "./storage";
import { timestamps } from "./helpers";

export const courses = pgTable(
  "courses",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    code: varchar("code", { length: 40 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    level: academicLevelEnum().notNull(),
    semester: semesterTermEnum().notNull(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [
    unique("courses_code_unique").on(table.code),
    index("courses_level_semester_idx").on(table.level, table.semester),
  ],
);

export const lecturers = pgTable(
  "lecturers",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 255 }).notNull(),
    title: varchar("title", { length: 120 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 80 }),
    officeLocation: varchar("office_location", { length: 255 }),
    officeHours: text("office_hours"),
    photoStorageObjectId: text("photo_storage_object_id").references(
      () => storageObjects.id,
      { onDelete: "set null" },
    ),
    ...timestamps,
  },
  (table) => [
    index("lecturers_name_idx").on(table.name),
    index("lecturers_email_idx").on(table.email),
  ],
);

export const lecturerCourses = pgTable(
  "lecturer_courses",
  {
    lecturerId: integer("lecturer_id")
      .notNull()
      .references(() => lecturers.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.lecturerId, table.courseId],
      name: "lecturer_courses_pk",
    }),
  ],
);
