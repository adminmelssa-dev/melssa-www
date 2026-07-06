import { z } from "zod";
import { contentStatusSchema } from "@/modules/content/contracts";
export {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_OPTIONS,
  contentStatusSchema,
  type ContentStatus,
} from "@/modules/content/contracts";

const optionalTextSchema = (maxLength: number) =>
  z
    .union([z.string().trim().max(maxLength), z.null(), z.undefined()])
    .transform((value) => {
      if (typeof value !== "string" || value.length === 0) return null;
      return value;
    });

export const spotlightPhotoSchema = z.object({
  id: z.string(),
  publicUrl: z.url(),
  objectKey: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  byteSize: z.number().int().min(0),
});

export const spotlightCreatorSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
  })
  .nullable();

export const spotlightRowSchema = z.object({
  id: z.number().int().positive(),
  studentName: z.string(),
  headline: z.string(),
  body: z.string(),
  status: contentStatusSchema,
  photo: spotlightPhotoSchema.nullable(),
  creator: spotlightCreatorSchema,
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminSpotlightsResponseSchema = z.object({
  spotlights: z.array(spotlightRowSchema),
});

export const publicSpotlightsResponseSchema = z.object({
  spotlights: z.array(spotlightRowSchema),
});

export const createSpotlightInputSchema = z.object({
  studentName: z
    .string()
    .trim()
    .min(2, "Student name must be at least 2 characters.")
    .max(255, "Student name must be 255 characters or fewer."),
  headline: z
    .string()
    .trim()
    .min(3, "Headline must be at least 3 characters.")
    .max(255, "Headline must be 255 characters or fewer."),
  body: z
    .string()
    .trim()
    .min(20, "Spotlight story must be at least 20 characters.")
    .max(20_000, "Spotlight story must be 20,000 characters or fewer."),
  status: contentStatusSchema.default("draft"),
  photoStorageObjectId: z
    .union([z.string().min(1), z.null(), z.undefined()])
    .transform((value) => value ?? null),
});

export const updateSpotlightInputSchema = createSpotlightInputSchema.extend({
  spotlightId: z.number().int().positive(),
});

export const deleteSpotlightInputSchema = z.object({
  spotlightId: z.number().int().positive(),
});

export const spotlightSummaryInputSchema = optionalTextSchema(300);

export type SpotlightPhoto = z.infer<typeof spotlightPhotoSchema>;
export type SpotlightCreator = z.infer<typeof spotlightCreatorSchema>;
export type SpotlightRow = z.infer<typeof spotlightRowSchema>;
export type AdminSpotlightsResponse = z.infer<
  typeof adminSpotlightsResponseSchema
>;
export type PublicSpotlightsResponse = z.infer<
  typeof publicSpotlightsResponseSchema
>;
export type CreateSpotlightInput = z.infer<typeof createSpotlightInputSchema>;
export type UpdateSpotlightInput = z.infer<typeof updateSpotlightInputSchema>;
export type DeleteSpotlightInput = z.infer<typeof deleteSpotlightInputSchema>;
