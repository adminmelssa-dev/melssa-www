import { z } from "zod";
import {
  contentStatusSchema,
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_OPTIONS,
  type ContentStatus,
} from "@/modules/content/contracts";

export { CONTENT_STATUS_LABELS, CONTENT_STATUS_OPTIONS };

export const scholarshipApplicationModeSchema = z.union([
  z.literal("information"),
  z.literal("external"),
]);

export type ScholarshipApplicationMode = z.infer<
  typeof scholarshipApplicationModeSchema
>;

export const SCHOLARSHIP_APPLICATION_MODE_LABELS: Record<
  ScholarshipApplicationMode,
  string
> = {
  external: "External Application",
  information: "Information Only",
};

export const SCHOLARSHIP_APPLICATION_MODE_OPTIONS: {
  value: ScholarshipApplicationMode;
  label: string;
}[] = [
  {
    value: "external",
    label: SCHOLARSHIP_APPLICATION_MODE_LABELS.external,
  },
  {
    value: "information",
    label: SCHOLARSHIP_APPLICATION_MODE_LABELS.information,
  },
];

const optionalTextSchema = (maxLength: number) =>
  z
    .union([z.string().trim().max(maxLength), z.null(), z.undefined()])
    .transform((value) => {
      if (typeof value !== "string" || value.length === 0) return null;
      return value;
    });

const optionalUrlSchema = z
  .union([z.string().trim(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string" || value.length === 0) return null;
    return value;
  })
  .pipe(z.url().nullable());

const optionalEmailSchema = z
  .union([z.string().trim().toLowerCase(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string" || value.length === 0) return null;
    return value;
  })
  .pipe(z.email().nullable());

const optionalDateSchema = z
  .union([z.string().trim(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string" || value.length === 0) return null;
    return value;
  })
  .pipe(z.iso.datetime({ offset: true }).nullable());

export const scholarshipAttachmentSchema = z
  .object({
    id: z.string(),
    publicUrl: z.url(),
    objectKey: z.string(),
    originalFilename: z.string(),
  })
  .nullable();

export const scholarshipProgramRowSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  slug: z.string(),
  providerName: z.string(),
  summary: z.string().nullable(),
  description: z.string(),
  status: contentStatusSchema,
  academicYear: z.string().nullable(),
  amountDescription: z.string().nullable(),
  eligibility: z.string().nullable(),
  requirements: z.string().nullable(),
  applicationMode: scholarshipApplicationModeSchema,
  applicationUrl: z.url().nullable(),
  applicationInstructions: z.string().nullable(),
  contactEmail: z.email().nullable(),
  opensAt: z.string().nullable(),
  closesAt: z.string().nullable(),
  attachment: scholarshipAttachmentSchema,
  creator: z
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

export const adminScholarshipProgramsResponseSchema = z.object({
  scholarshipPrograms: z.array(scholarshipProgramRowSchema),
});

export const createScholarshipProgramInputSchema = z
  .object({
    title: z.string().trim().min(2).max(255),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a URL-safe slug."),
    providerName: z.string().trim().min(2).max(255),
    summary: optionalTextSchema(1_000),
    description: z.string().trim().min(20).max(20_000),
    status: contentStatusSchema.default("draft"),
    academicYear: optionalTextSchema(20),
    amountDescription: optionalTextSchema(255),
    eligibility: optionalTextSchema(5_000),
    requirements: optionalTextSchema(5_000),
    applicationMode: scholarshipApplicationModeSchema.default("external"),
    applicationUrl: optionalUrlSchema,
    applicationInstructions: optionalTextSchema(5_000),
    contactEmail: optionalEmailSchema,
    opensAt: optionalDateSchema,
    closesAt: optionalDateSchema,
    attachmentStorageObjectId: optionalTextSchema(255),
  })
  .superRefine((value, ctx) => {
    if (value.applicationMode === "external" && value.applicationUrl === null) {
      ctx.addIssue({
        code: "custom",
        path: ["applicationUrl"],
        message: "External scholarship programmes require an application URL.",
      });
    }

    if (
      value.opensAt &&
      value.closesAt &&
      new Date(value.closesAt).getTime() < new Date(value.opensAt).getTime()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["closesAt"],
        message: "Close date cannot be before the open date.",
      });
    }
  });

export const updateScholarshipProgramInputSchema =
  createScholarshipProgramInputSchema.extend({
    scholarshipProgramId: z.number().int().positive(),
  });

export const deleteScholarshipProgramInputSchema = z.object({
  scholarshipProgramId: z.number().int().positive(),
});

export type ScholarshipAttachment = z.infer<typeof scholarshipAttachmentSchema>;
export type ScholarshipProgramRow = z.infer<typeof scholarshipProgramRowSchema>;
export type CreateScholarshipProgramInput = z.infer<
  typeof createScholarshipProgramInputSchema
>;
export type UpdateScholarshipProgramInput = z.infer<
  typeof updateScholarshipProgramInputSchema
>;
export type DeleteScholarshipProgramInput = z.infer<
  typeof deleteScholarshipProgramInputSchema
>;
export type AdminScholarshipProgramsResponse = z.infer<
  typeof adminScholarshipProgramsResponseSchema
>;
export type ScholarshipContentStatus = ContentStatus;
