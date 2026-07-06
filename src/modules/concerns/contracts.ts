import { z } from "zod";

export const concernCategorySchema = z.union([
  z.literal("academic"),
  z.literal("welfare"),
  z.literal("facilities"),
  z.literal("harassment"),
  z.literal("finance"),
  z.literal("other"),
]);

export const concernStatusSchema = z.union([
  z.literal("new"),
  z.literal("reviewing"),
  z.literal("resolved"),
  z.literal("archived"),
]);

export type ConcernCategory = z.infer<typeof concernCategorySchema>;
export type ConcernStatus = z.infer<typeof concernStatusSchema>;

export const CONCERN_CATEGORY_LABELS: Record<ConcernCategory, string> = {
  academic: "Academic",
  welfare: "Welfare",
  facilities: "Facilities",
  harassment: "Harassment",
  finance: "Finance",
  other: "Other",
};

export const CONCERN_STATUS_LABELS: Record<ConcernStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  resolved: "Resolved",
  archived: "Archived",
};

export const CONCERN_CATEGORY_OPTIONS: {
  value: ConcernCategory;
  label: string;
}[] = [
  { value: "academic", label: CONCERN_CATEGORY_LABELS.academic },
  { value: "welfare", label: CONCERN_CATEGORY_LABELS.welfare },
  { value: "facilities", label: CONCERN_CATEGORY_LABELS.facilities },
  { value: "harassment", label: CONCERN_CATEGORY_LABELS.harassment },
  { value: "finance", label: CONCERN_CATEGORY_LABELS.finance },
  { value: "other", label: CONCERN_CATEGORY_LABELS.other },
];

export const CONCERN_STATUS_OPTIONS: {
  value: ConcernStatus;
  label: string;
}[] = [
  { value: "new", label: CONCERN_STATUS_LABELS.new },
  { value: "reviewing", label: CONCERN_STATUS_LABELS.reviewing },
  { value: "resolved", label: CONCERN_STATUS_LABELS.resolved },
  { value: "archived", label: CONCERN_STATUS_LABELS.archived },
];

const optionalTextSchema = (maxLength: number) =>
  z
    .union([z.string().trim().max(maxLength), z.null(), z.undefined()])
    .transform((value) => {
      if (typeof value !== "string" || value.length === 0) return null;
      return value;
    });

export const concernAttachmentSchema = z.object({
  id: z.string(),
  publicUrl: z.url(),
  objectKey: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  byteSize: z.number().int().min(0),
});

export const concernReviewerSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
  })
  .nullable();

export const concernRowSchema = z.object({
  id: z.number().int().positive(),
  category: concernCategorySchema,
  subject: z.string(),
  message: z.string(),
  status: concernStatusSchema,
  attachment: concernAttachmentSchema.nullable(),
  reviewedBy: concernReviewerSchema,
  reviewedAt: z.string().nullable(),
  internalNote: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminConcernsResponseSchema = z.object({
  concerns: z.array(concernRowSchema),
});

export const createConcernInputSchema = z.object({
  category: concernCategorySchema.default("other"),
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters.")
    .max(255, "Subject must be 255 characters or fewer."),
  message: z
    .string()
    .trim()
    .min(20, "Concern details must be at least 20 characters.")
    .max(10_000, "Concern details must be 10,000 characters or fewer."),
  attachmentStorageObjectId: z
    .union([z.string().min(1), z.null(), z.undefined()])
    .transform((value) => value ?? null),
});

export const updateConcernInputSchema = z.object({
  concernId: z.number().int().positive(),
  status: concernStatusSchema,
  internalNote: optionalTextSchema(5_000),
});

export type ConcernAttachment = z.infer<typeof concernAttachmentSchema>;
export type ConcernReviewer = z.infer<typeof concernReviewerSchema>;
export type ConcernRow = z.infer<typeof concernRowSchema>;
export type AdminConcernsResponse = z.infer<typeof adminConcernsResponseSchema>;
export type CreateConcernInput = z.infer<typeof createConcernInputSchema>;
export type UpdateConcernInput = z.infer<typeof updateConcernInputSchema>;
