import { z } from "zod";
import { semesterTermSchema } from "@/modules/academics/contracts";
import {
  contentStatusSchema,
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_OPTIONS,
  type ContentStatus,
} from "@/modules/content/contracts";

export { CONTENT_STATUS_LABELS, CONTENT_STATUS_OPTIONS };

export const financeDocumentTypeSchema = z.union([
  z.literal("semester_report"),
  z.literal("annual_report"),
  z.literal("programme_budget"),
]);

export type FinanceDocumentType = z.infer<typeof financeDocumentTypeSchema>;

export const FINANCE_DOCUMENT_TYPE_LABELS: Record<
  FinanceDocumentType,
  string
> = {
  annual_report: "Annual Report",
  programme_budget: "Programme Budget",
  semester_report: "Semester Report",
};

export const FINANCE_DOCUMENT_TYPE_OPTIONS: {
  value: FinanceDocumentType;
  label: string;
}[] = [
  {
    value: "semester_report",
    label: FINANCE_DOCUMENT_TYPE_LABELS.semester_report,
  },
  {
    value: "annual_report",
    label: FINANCE_DOCUMENT_TYPE_LABELS.annual_report,
  },
  {
    value: "programme_budget",
    label: FINANCE_DOCUMENT_TYPE_LABELS.programme_budget,
  },
];

const optionalTextSchema = (maxLength: number) =>
  z
    .union([z.string().trim().max(maxLength), z.null(), z.undefined()])
    .transform((value) => {
      if (typeof value !== "string" || value.length === 0) return null;
      return value;
    });

const optionalDateSchema = z
  .union([z.string().trim(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string" || value.length === 0) return null;
    return value;
  })
  .pipe(z.iso.datetime({ offset: true }).nullable());

export const financeDocumentFileSchema = z.object({
  id: z.string(),
  publicUrl: z.url(),
  objectKey: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  byteSize: z.number().int().min(0),
});

export const financeDocumentRowSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  summary: z.string().nullable(),
  type: financeDocumentTypeSchema,
  status: contentStatusSchema,
  academicYear: z.string(),
  semester: semesterTermSchema.nullable(),
  programmeName: z.string().nullable(),
  datePresented: z.string().nullable(),
  file: financeDocumentFileSchema.nullable(),
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

export const adminFinanceDocumentsResponseSchema = z.object({
  financeDocuments: z.array(financeDocumentRowSchema),
});

const financeDocumentInputBaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Document title must be at least 2 characters.")
    .max(255, "Document title must be 255 characters or fewer."),
  summary: optionalTextSchema(1_000),
  type: financeDocumentTypeSchema,
  academicYear: z
    .string()
    .trim()
    .min(4, "Academic year is required.")
    .max(20, "Academic year must be 20 characters or fewer."),
  semester: z
    .union([semesterTermSchema, z.null(), z.undefined()])
    .transform((value) => value ?? null),
  programmeName: optionalTextSchema(255),
  datePresented: optionalDateSchema,
  storageObjectId: z.string().min(1, "Upload a finance document first."),
  status: contentStatusSchema.default("draft"),
});

export const createFinanceDocumentInputSchema =
  financeDocumentInputBaseSchema.superRefine(validateFinanceDocumentMetadata);

export const updateFinanceDocumentInputSchema =
  financeDocumentInputBaseSchema
    .omit({ storageObjectId: true })
    .extend({
      financeDocumentId: z.number().int().positive(),
    })
    .superRefine(validateFinanceDocumentMetadata);

export const deleteFinanceDocumentInputSchema = z.object({
  financeDocumentId: z.number().int().positive(),
});

export type FinanceDocumentFile = z.infer<typeof financeDocumentFileSchema>;
export type FinanceDocumentRow = z.infer<typeof financeDocumentRowSchema>;
export type CreateFinanceDocumentInput = z.infer<
  typeof createFinanceDocumentInputSchema
>;
export type UpdateFinanceDocumentInput = z.infer<
  typeof updateFinanceDocumentInputSchema
>;
export type DeleteFinanceDocumentInput = z.infer<
  typeof deleteFinanceDocumentInputSchema
>;
export type AdminFinanceDocumentsResponse = z.infer<
  typeof adminFinanceDocumentsResponseSchema
>;
export type FinanceContentStatus = ContentStatus;

function validateFinanceDocumentMetadata(
  value: {
    type: FinanceDocumentType;
    semester: z.infer<typeof semesterTermSchema> | null;
    programmeName: string | null;
  },
  ctx: z.RefinementCtx,
): void {
  if (value.type === "semester_report" && value.semester === null) {
    ctx.addIssue({
      code: "custom",
      path: ["semester"],
      message: "Semester reports require a semester.",
    });
  }

  if (value.type === "programme_budget" && value.programmeName === null) {
    ctx.addIssue({
      code: "custom",
      path: ["programmeName"],
      message: "Programme budgets require a programme name.",
    });
  }
}
