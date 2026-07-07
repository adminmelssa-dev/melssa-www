import { z } from "zod";
import { dataTablePageMetaSchema } from "@/lib/data-table-query";

export const lecturerCourseSchema = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  title: z.string(),
});

export const lecturerPhotoSchema = z.object({
  id: z.string(),
  publicUrl: z.url(),
  objectKey: z.string(),
  originalFilename: z.string(),
});

export const lecturerRowSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  title: z.string().nullable(),
  email: z.email().nullable(),
  phone: z.string().nullable(),
  officeLocation: z.string().nullable(),
  officeHours: z.string().nullable(),
  photo: lecturerPhotoSchema.nullable(),
  courses: z.array(lecturerCourseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const optionalTextSchema = (maxLength: number) =>
  z
    .union([z.string().trim().max(maxLength), z.null(), z.undefined()])
    .transform((value) => {
      if (typeof value !== "string" || value.length === 0) return null;
      return value;
    });

export const createLecturerInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Lecturer name must be at least 2 characters.")
    .max(255, "Lecturer name must be 255 characters or fewer."),
  title: optionalTextSchema(120),
  email: z
    .union([z.email(), z.literal(""), z.null(), z.undefined()])
    .transform((value) => {
      if (typeof value !== "string" || value.length === 0) return null;
      return value.toLowerCase();
    }),
  phone: optionalTextSchema(80),
  officeLocation: optionalTextSchema(255),
  officeHours: optionalTextSchema(1_000),
  photoStorageObjectId: z
    .union([z.string().min(1), z.null(), z.undefined()])
    .transform((value) => value ?? null),
  courseIds: z
    .array(z.number().int().positive())
    .max(20, "A lecturer can be assigned to at most 20 courses.")
    .default([]),
});

export const updateLecturerInputSchema = createLecturerInputSchema.extend({
  lecturerId: z.number().int().positive(),
});

export const deleteLecturerInputSchema = z.object({
  lecturerId: z.number().int().positive(),
});

export const adminLecturersResponseSchema = z.object({
  lecturers: z.array(lecturerRowSchema),
  meta: dataTablePageMetaSchema,
});

export type LecturerCourse = z.infer<typeof lecturerCourseSchema>;
export type LecturerPhoto = z.infer<typeof lecturerPhotoSchema>;
export type LecturerRow = z.infer<typeof lecturerRowSchema>;
export type CreateLecturerInput = z.infer<typeof createLecturerInputSchema>;
export type UpdateLecturerInput = z.infer<typeof updateLecturerInputSchema>;
export type DeleteLecturerInput = z.infer<typeof deleteLecturerInputSchema>;
export type AdminLecturersResponse = z.infer<
  typeof adminLecturersResponseSchema
>;
