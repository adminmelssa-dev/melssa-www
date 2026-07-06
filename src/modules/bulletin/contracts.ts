import { z } from "zod";

const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email());

const trimmedOptionalString = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const bulletinRichTextSchema = ({
  maxHtml,
  maxText,
  minText,
}: {
  maxHtml: number;
  maxText: number;
  minText: number;
}) =>
  z
    .string()
    .trim()
    .max(maxHtml)
    .superRefine((value, ctx) => {
      const plainText = getBulletinRichTextPlainText(value);

      if (plainText.length < minText) {
        ctx.addIssue({
          code: "custom",
          message: `Enter at least ${minText} characters of text.`,
        });
      }

      if (plainText.length > maxText) {
        ctx.addIssue({
          code: "custom",
          message: `Keep the text under ${maxText} characters.`,
        });
      }
    });

export const bulletinSubscriptionSourceSchema = z
  .string()
  .trim()
  .min(1)
  .max(80);

export const subscribeToBulletinInputSchema = z.object({
  email: normalizedEmailSchema,
  source: bulletinSubscriptionSourceSchema.default("footer"),
});

export const bulletinIssueStatusSchema = z.union([
  z.literal("draft"),
  z.literal("sent"),
  z.literal("archived"),
]);

export const bulletinDeliveryStatusSchema = z.union([
  z.literal("sent"),
  z.literal("failed"),
]);

export const bulletinSectionCategorySchema = z.union([
  z.literal("academic"),
  z.literal("association"),
  z.literal("events"),
  z.literal("resources"),
  z.literal("opportunities"),
  z.literal("reminder"),
]);

export const BULLETIN_STATUS_LABELS: Record<BulletinIssueStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  archived: "Archived",
};

export const BULLETIN_SECTION_CATEGORY_LABELS: Record<
  BulletinSectionCategory,
  string
> = {
  academic: "Academic",
  association: "Association",
  events: "Events",
  resources: "Resources",
  opportunities: "Opportunities",
  reminder: "Reminder",
};

export const BULLETIN_STATUS_OPTIONS = [
  { label: BULLETIN_STATUS_LABELS.draft, value: "draft" },
  { label: BULLETIN_STATUS_LABELS.sent, value: "sent" },
  { label: BULLETIN_STATUS_LABELS.archived, value: "archived" },
];

export const BULLETIN_SECTION_CATEGORY_OPTIONS = [
  { label: BULLETIN_SECTION_CATEGORY_LABELS.academic, value: "academic" },
  { label: BULLETIN_SECTION_CATEGORY_LABELS.association, value: "association" },
  { label: BULLETIN_SECTION_CATEGORY_LABELS.events, value: "events" },
  { label: BULLETIN_SECTION_CATEGORY_LABELS.resources, value: "resources" },
  {
    label: BULLETIN_SECTION_CATEGORY_LABELS.opportunities,
    value: "opportunities",
  },
  { label: BULLETIN_SECTION_CATEGORY_LABELS.reminder, value: "reminder" },
];

export const bulletinSectionSchema = z.object({
  heading: z.string().trim().min(3).max(120),
  body: bulletinRichTextSchema({
    maxHtml: 12_000,
    maxText: 2_500,
    minText: 20,
  }),
  category: bulletinSectionCategorySchema,
});

export const bulletinAudienceTagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9][a-z0-9-]*$/, {
    message: "Use lowercase letters, numbers, and hyphens.",
  });

export const createBulletinIssueInputSchema = z.object({
  title: z.string().trim().min(3).max(255),
  subject: z.string().trim().min(5).max(180),
  previewText: trimmedOptionalString.pipe(z.string().max(255).nullable()),
  editorNote: bulletinRichTextSchema({
    maxHtml: 16_000,
    maxText: 4_000,
    minText: 20,
  }),
  sections: z.array(bulletinSectionSchema).min(1).max(8),
  audienceTags: z.array(bulletinAudienceTagSchema).max(12).default([]),
});

export const updateBulletinIssueInputSchema =
  createBulletinIssueInputSchema.extend({
    bulletinId: z.number().int().positive(),
  });

export const sendBulletinIssueInputSchema = z.object({
  bulletinId: z.number().int().positive(),
});

export const archiveBulletinIssueInputSchema = z.object({
  bulletinId: z.number().int().positive(),
});

export const adminBulletinMutationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("update"),
    payload: updateBulletinIssueInputSchema,
  }),
  z.object({
    type: z.literal("send"),
    payload: sendBulletinIssueInputSchema,
  }),
  z.object({
    type: z.literal("archive"),
    payload: archiveBulletinIssueInputSchema,
  }),
]);

export const bulletinDeliveryRowSchema = z.object({
  id: z.number(),
  email: z.email(),
  status: bulletinDeliveryStatusSchema,
  provider: z.string().nullable(),
  messageId: z.string().nullable(),
  errorMessage: z.string().nullable(),
  sentAt: z.string().nullable(),
  createdAt: z.string(),
});

export const bulletinIssueRowSchema = z.object({
  id: z.number(),
  title: z.string(),
  subject: z.string(),
  previewText: z.string().nullable(),
  editorNote: z.string(),
  sections: z.array(bulletinSectionSchema),
  audienceTags: z.array(z.string()),
  status: bulletinIssueStatusSchema,
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
  sentById: z.string().nullable(),
  sentAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
  recipientCount: z.number(),
  deliverySuccessCount: z.number(),
  deliveryFailureCount: z.number(),
  lastDeliveryError: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminBulletinsResponseSchema = z.object({
  bulletins: z.array(bulletinIssueRowSchema),
  subscriberCount: z.number(),
});

export const bulletinUnsubscribeInputSchema = z.object({
  token: z.string().trim().min(20).max(512),
});

export const bulletinUnsubscribePreviewSchema = z.object({
  email: z.email(),
  status: z.union([z.literal("active"), z.literal("unsubscribed")]),
});

export type SubscribeToBulletinInput = z.infer<
  typeof subscribeToBulletinInputSchema
>;
export type BulletinIssueStatus = z.infer<typeof bulletinIssueStatusSchema>;
export type BulletinDeliveryStatus = z.infer<
  typeof bulletinDeliveryStatusSchema
>;
export type BulletinSectionCategory = z.infer<
  typeof bulletinSectionCategorySchema
>;
export type BulletinSection = z.infer<typeof bulletinSectionSchema>;
export type CreateBulletinIssueInput = z.infer<
  typeof createBulletinIssueInputSchema
>;
export type UpdateBulletinIssueInput = z.infer<
  typeof updateBulletinIssueInputSchema
>;
export type SendBulletinIssueInput = z.infer<
  typeof sendBulletinIssueInputSchema
>;
export type ArchiveBulletinIssueInput = z.infer<
  typeof archiveBulletinIssueInputSchema
>;
export type AdminBulletinMutation = z.infer<
  typeof adminBulletinMutationSchema
>;
export type BulletinDeliveryRow = z.infer<typeof bulletinDeliveryRowSchema>;
export type BulletinIssueRow = z.infer<typeof bulletinIssueRowSchema>;
export type AdminBulletinsResponse = z.infer<
  typeof adminBulletinsResponseSchema
>;
export type BulletinUnsubscribeInput = z.infer<
  typeof bulletinUnsubscribeInputSchema
>;
export type BulletinUnsubscribePreview = z.infer<
  typeof bulletinUnsubscribePreviewSchema
>;

export function getBulletinRichTextPlainText(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}
