import { z } from "zod";
import {
  contentStatusSchema,
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_OPTIONS,
  type ContentStatus,
} from "@/modules/content/contracts";
import { dataTablePageMetaSchema } from "@/lib/data-table-query";

export { CONTENT_STATUS_LABELS, CONTENT_STATUS_OPTIONS };

export const fundraisingInquiryStatusSchema = z.union([
  z.literal("new"),
  z.literal("reviewing"),
  z.literal("responded"),
  z.literal("archived"),
]);

export type FundraisingInquiryStatus = z.infer<
  typeof fundraisingInquiryStatusSchema
>;

export const FUNDRAISING_INQUIRY_STATUS_LABELS: Record<
  FundraisingInquiryStatus,
  string
> = {
  archived: "Archived",
  new: "New",
  responded: "Responded",
  reviewing: "Reviewing",
};

export const FUNDRAISING_INQUIRY_STATUS_OPTIONS: {
  value: FundraisingInquiryStatus;
  label: string;
}[] = [
  { value: "new", label: FUNDRAISING_INQUIRY_STATUS_LABELS.new },
  { value: "reviewing", label: FUNDRAISING_INQUIRY_STATUS_LABELS.reviewing },
  { value: "responded", label: FUNDRAISING_INQUIRY_STATUS_LABELS.responded },
  { value: "archived", label: FUNDRAISING_INQUIRY_STATUS_LABELS.archived },
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

const optionalPositiveIntegerSchema = z
  .union([z.number().int().positive(), z.null(), z.undefined()])
  .transform((value) => value ?? null);

const supportedCurrencyCodes = new Set(Intl.supportedValuesOf("currency"));

const currencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(3)
  .refine(isSupportedCurrencyCode, "Use a valid ISO 4217 currency code.");

export const fundraisingPaymentMethodSchema = z.object({
  label: z.string().trim().min(2).max(120),
  accountName: optionalTextSchema(160),
  accountNumber: optionalTextSchema(120),
  network: optionalTextSchema(120),
  instructions: optionalTextSchema(500),
});

export const sponsorshipTierSchema = z.object({
  name: z.string().trim().min(2).max(120),
  amountLabel: optionalTextSchema(120),
  benefits: z.array(z.string().trim().min(2).max(180)).max(8).default([]),
});

export const fundraisingCoverSchema = z
  .object({
    id: z.string(),
    publicUrl: z.url(),
    objectKey: z.string(),
    originalFilename: z.string(),
  })
  .nullable();

export const fundraisingCampaignRowSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  body: z.string(),
  status: contentStatusSchema,
  goalAmountMinor: z.number().int().positive().nullable(),
  currency: z.string(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  paymentInstructions: z.string().nullable(),
  paymentMethods: z.array(fundraisingPaymentMethodSchema),
  sponsorshipTiers: z.array(sponsorshipTierSchema),
  cover: fundraisingCoverSchema,
  creator: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.email(),
    })
    .nullable(),
  inquiryCount: z.number().int().min(0),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const fundraisingInquiryRowSchema = z.object({
  id: z.number().int().positive(),
  campaign: z
    .object({
      id: z.number().int().positive(),
      title: z.string(),
    })
    .nullable(),
  organizationName: z.string().nullable(),
  contactName: z.string(),
  contactEmail: z.email(),
  phone: z.string().nullable(),
  message: z.string(),
  status: fundraisingInquiryStatusSchema,
  internalNotes: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminFundraisingResponseSchema = z.object({
  campaigns: z.array(fundraisingCampaignRowSchema),
  campaignMeta: dataTablePageMetaSchema,
  inquiries: z.array(fundraisingInquiryRowSchema),
  inquiryMeta: dataTablePageMetaSchema,
});

export const adminFundraisingCampaignsResponseSchema = z.object({
  campaigns: z.array(fundraisingCampaignRowSchema),
  meta: dataTablePageMetaSchema,
});

export const adminFundraisingInquiriesResponseSchema = z.object({
  inquiries: z.array(fundraisingInquiryRowSchema),
  meta: dataTablePageMetaSchema,
});

export const createFundraisingCampaignInputSchema = z
  .object({
    title: z.string().trim().min(2).max(255),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a URL-safe slug."),
    summary: optionalTextSchema(1_000),
    body: z.string().trim().min(20).max(20_000),
    status: contentStatusSchema.default("draft"),
    goalAmountMinor: optionalPositiveIntegerSchema,
    currency: currencyCodeSchema.default("GHS"),
    startsAt: optionalDateSchema,
    endsAt: optionalDateSchema,
    paymentInstructions: optionalTextSchema(2_000),
    paymentMethods: z.array(fundraisingPaymentMethodSchema).max(8).default([]),
    sponsorshipTiers: z.array(sponsorshipTierSchema).max(8).default([]),
    coverStorageObjectId: optionalTextSchema(255),
  })
  .superRefine((value, ctx) => {
    if (
      value.startsAt &&
      value.endsAt &&
      new Date(value.endsAt).getTime() < new Date(value.startsAt).getTime()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End date cannot be before the start date.",
      });
    }
  });

export const updateFundraisingCampaignInputSchema =
  createFundraisingCampaignInputSchema.extend({
    campaignId: z.number().int().positive(),
  });

export const deleteFundraisingCampaignInputSchema = z.object({
  campaignId: z.number().int().positive(),
});

export const createFundraisingInquiryInputSchema = z.object({
  campaignId: optionalPositiveIntegerSchema,
  organizationName: optionalTextSchema(255),
  contactName: z.string().trim().min(2).max(255),
  contactEmail: z.string().trim().toLowerCase().pipe(z.email()),
  phone: optionalTextSchema(80),
  message: z.string().trim().min(20).max(5_000),
});

export const updateFundraisingInquiryInputSchema = z.object({
  inquiryId: z.number().int().positive(),
  status: fundraisingInquiryStatusSchema,
  internalNotes: optionalTextSchema(2_000),
});

export const adminFundraisingMutationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("campaign"),
    payload: updateFundraisingCampaignInputSchema,
  }),
  z.object({
    type: z.literal("inquiry"),
    payload: updateFundraisingInquiryInputSchema,
  }),
]);

export type FundraisingPaymentMethod = z.infer<
  typeof fundraisingPaymentMethodSchema
>;
export type SponsorshipTier = z.infer<typeof sponsorshipTierSchema>;
export type FundraisingCampaignRow = z.infer<
  typeof fundraisingCampaignRowSchema
>;
export type FundraisingInquiryRow = z.infer<
  typeof fundraisingInquiryRowSchema
>;
export type CreateFundraisingCampaignInput = z.infer<
  typeof createFundraisingCampaignInputSchema
>;
export type UpdateFundraisingCampaignInput = z.infer<
  typeof updateFundraisingCampaignInputSchema
>;
export type DeleteFundraisingCampaignInput = z.infer<
  typeof deleteFundraisingCampaignInputSchema
>;
export type CreateFundraisingInquiryInput = z.infer<
  typeof createFundraisingInquiryInputSchema
>;
export type UpdateFundraisingInquiryInput = z.infer<
  typeof updateFundraisingInquiryInputSchema
>;
export type AdminFundraisingResponse = z.infer<
  typeof adminFundraisingResponseSchema
>;
export type AdminFundraisingCampaignsResponse = z.infer<
  typeof adminFundraisingCampaignsResponseSchema
>;
export type AdminFundraisingInquiriesResponse = z.infer<
  typeof adminFundraisingInquiriesResponseSchema
>;
export type AdminFundraisingMutation = z.infer<
  typeof adminFundraisingMutationSchema
>;
export type FundraisingContentStatus = ContentStatus;

function isSupportedCurrencyCode(value: string): boolean {
  return supportedCurrencyCodes.has(value);
}
