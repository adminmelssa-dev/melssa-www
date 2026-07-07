import { z } from "zod";
import { dataTablePageMetaSchema } from "@/lib/data-table-query";

export const academicLevelSchema = z.union([
  z.literal("level100"),
  z.literal("level200"),
  z.literal("level300"),
  z.literal("level400"),
]);

export const semesterTermSchema = z.union([
  z.literal("first"),
  z.literal("second"),
]);

export type AcademicLevel = z.infer<typeof academicLevelSchema>;
export type SemesterTerm = z.infer<typeof semesterTermSchema>;

export const ACADEMIC_LEVEL_LABELS: Record<AcademicLevel, string> = {
  level100: "Level 100",
  level200: "Level 200",
  level300: "Level 300",
  level400: "Level 400",
};

export const SEMESTER_TERM_LABELS: Record<SemesterTerm, string> = {
  first: "First Semester",
  second: "Second Semester",
};

export const ACADEMIC_LEVEL_OPTIONS: {
  value: AcademicLevel;
  label: string;
}[] = [
  { value: "level100", label: ACADEMIC_LEVEL_LABELS.level100 },
  { value: "level200", label: ACADEMIC_LEVEL_LABELS.level200 },
  { value: "level300", label: ACADEMIC_LEVEL_LABELS.level300 },
  { value: "level400", label: ACADEMIC_LEVEL_LABELS.level400 },
];

export const SEMESTER_TERM_OPTIONS: {
  value: SemesterTerm;
  label: string;
}[] = [
  { value: "first", label: SEMESTER_TERM_LABELS.first },
  { value: "second", label: SEMESTER_TERM_LABELS.second },
];

const courseCodeSchema = z
  .string()
  .trim()
  .min(2, "Course code must be at least 2 characters.")
  .max(40, "Course code must be 40 characters or fewer.")
  .transform((value) => value.toUpperCase().replace(/\s+/g, " "));

const courseDescriptionInputSchema = z
  .union([z.string().trim().max(1_000), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string" || value.length === 0) return null;
    return value;
  });

export const courseRowSchema = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  title: z.string(),
  level: academicLevelSchema,
  semester: semesterTermSchema,
  description: z.string().nullable(),
  resourceCount: z.number().int().min(0),
  lecturerCount: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminCoursesResponseSchema = z.object({
  courses: z.array(courseRowSchema),
  meta: dataTablePageMetaSchema,
});

export const createCourseInputSchema = z.object({
  code: courseCodeSchema,
  title: z
    .string()
    .trim()
    .min(2, "Course title must be at least 2 characters.")
    .max(255, "Course title must be 255 characters or fewer."),
  level: academicLevelSchema,
  semester: semesterTermSchema,
  description: courseDescriptionInputSchema,
});

export const updateCourseInputSchema = createCourseInputSchema.extend({
  courseId: z.number().int().positive(),
});

export const deleteCourseInputSchema = z.object({
  courseId: z.number().int().positive(),
});

export type CourseRow = z.infer<typeof courseRowSchema>;
export type AdminCoursesResponse = z.infer<typeof adminCoursesResponseSchema>;
export type CreateCourseInput = z.infer<typeof createCourseInputSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseInputSchema>;
export type DeleteCourseInput = z.infer<typeof deleteCourseInputSchema>;
