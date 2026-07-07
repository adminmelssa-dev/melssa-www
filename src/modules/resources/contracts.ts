import { z } from "zod";
import {
  academicLevelSchema,
  semesterTermSchema,
} from "@/modules/academics/contracts";
import {
  contentStatusSchema,
} from "@/modules/content/contracts";
import { dataTablePageMetaSchema } from "@/lib/data-table-query";
export {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_OPTIONS,
  contentStatusSchema,
  type ContentStatus,
} from "@/modules/content/contracts";

export const resourceTypeSchema = z.union([
  z.literal("lecture_slide"),
  z.literal("past_question"),
  z.literal("reference_material"),
]);

export type ResourceType = z.infer<typeof resourceTypeSchema>;

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  lecture_slide: "Lecture Slide",
  past_question: "Past Question",
  reference_material: "Reference Material",
};

export const RESOURCE_TYPE_OPTIONS: {
  value: ResourceType;
  label: string;
}[] = [
  { value: "lecture_slide", label: RESOURCE_TYPE_LABELS.lecture_slide },
  { value: "past_question", label: RESOURCE_TYPE_LABELS.past_question },
  {
    value: "reference_material",
    label: RESOURCE_TYPE_LABELS.reference_material,
  },
];

const optionalTextSchema = (maxLength: number) =>
  z
    .union([z.string().trim().max(maxLength), z.null(), z.undefined()])
    .transform((value) => {
      if (typeof value !== "string" || value.length === 0) return null;
      return value;
    });

const optionalCourseIdSchema = z
  .union([z.number().int().positive(), z.null(), z.undefined()])
  .transform((value) => value ?? null);

export const resourceCourseSchema = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  title: z.string(),
});

export const resourceFileSchema = z.object({
  id: z.string(),
  publicUrl: z.url(),
  objectKey: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  byteSize: z.number().int().min(0),
});

export const resourceRowSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string().nullable(),
  type: resourceTypeSchema,
  level: academicLevelSchema,
  semester: semesterTermSchema,
  academicYear: z.string().nullable(),
  status: contentStatusSchema,
  course: resourceCourseSchema.nullable(),
  file: resourceFileSchema,
  uploadedBy: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.email(),
    })
    .nullable(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminResourcesResponseSchema = z.object({
  meta: dataTablePageMetaSchema,
  resources: z.array(resourceRowSchema),
});

export const createResourceInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Resource title must be at least 2 characters.")
    .max(255, "Resource title must be 255 characters or fewer."),
  description: optionalTextSchema(1_000),
  type: resourceTypeSchema,
  level: academicLevelSchema,
  semester: semesterTermSchema,
  academicYear: optionalTextSchema(20),
  courseId: optionalCourseIdSchema,
  storageObjectId: z.string().min(1, "Upload a resource file first."),
  status: contentStatusSchema.default("draft"),
});

export const updateResourceInputSchema = createResourceInputSchema
  .omit({ storageObjectId: true })
  .extend({
    resourceId: z.number().int().positive(),
  });

export const deleteResourceInputSchema = z.object({
  resourceId: z.number().int().positive(),
});

export type ResourceCourse = z.infer<typeof resourceCourseSchema>;
export type ResourceFile = z.infer<typeof resourceFileSchema>;
export type ResourceRow = z.infer<typeof resourceRowSchema>;
export type CreateResourceInput = z.infer<typeof createResourceInputSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceInputSchema>;
export type DeleteResourceInput = z.infer<typeof deleteResourceInputSchema>;
export type AdminResourcesResponse = z.infer<
  typeof adminResourcesResponseSchema
>;
