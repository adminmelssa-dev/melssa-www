import { z } from "zod";

export const galleryItemTypeSchema = z.union([
  z.literal("event"),
  z.literal("seminar"),
  z.literal("health_screening"),
  z.literal("congress"),
  z.literal("outreach"),
  z.literal("other"),
]);

export type GalleryItemType = z.infer<typeof galleryItemTypeSchema>;

export const GALLERY_ITEM_TYPE_LABELS: Record<GalleryItemType, string> = {
  event: "Event",
  seminar: "Seminar",
  health_screening: "Health Screening",
  congress: "Congress",
  outreach: "Outreach",
  other: "Other",
};

export const GALLERY_ITEM_TYPE_OPTIONS: {
  value: GalleryItemType;
  label: string;
}[] = [
  { value: "event", label: GALLERY_ITEM_TYPE_LABELS.event },
  { value: "seminar", label: GALLERY_ITEM_TYPE_LABELS.seminar },
  {
    value: "health_screening",
    label: GALLERY_ITEM_TYPE_LABELS.health_screening,
  },
  { value: "congress", label: GALLERY_ITEM_TYPE_LABELS.congress },
  { value: "outreach", label: GALLERY_ITEM_TYPE_LABELS.outreach },
  { value: "other", label: GALLERY_ITEM_TYPE_LABELS.other },
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
  .refine(
    (value) => value === null || !Number.isNaN(new Date(value).getTime()),
    "Enter a valid captured date.",
  )
  .transform((value) => (value === null ? null : new Date(value).toISOString()));

export const galleryImageSchema = z.object({
  id: z.string(),
  publicUrl: z.url(),
  objectKey: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  byteSize: z.number().int().min(0),
});

export const galleryCreatorSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
  })
  .nullable();

export const galleryItemRowSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  caption: z.string().nullable(),
  type: galleryItemTypeSchema,
  image: galleryImageSchema,
  isFeatured: z.boolean(),
  capturedAt: z.string().nullable(),
  creator: galleryCreatorSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminGalleryResponseSchema = z.object({
  galleryItems: z.array(galleryItemRowSchema),
});

export const publicGalleryResponseSchema = adminGalleryResponseSchema;

export const createGalleryItemInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Gallery title must be at least 2 characters.")
    .max(255, "Gallery title must be 255 characters or fewer."),
  caption: optionalTextSchema(1_000),
  type: galleryItemTypeSchema.default("other"),
  storageObjectId: z.string().min(1, "Upload an image first."),
  isFeatured: z.boolean().default(false),
  capturedAt: optionalDateSchema,
});

export const updateGalleryItemInputSchema = createGalleryItemInputSchema.extend({
  galleryItemId: z.number().int().positive(),
});

export const deleteGalleryItemInputSchema = z.object({
  galleryItemId: z.number().int().positive(),
});

export type GalleryImage = z.infer<typeof galleryImageSchema>;
export type GalleryCreator = z.infer<typeof galleryCreatorSchema>;
export type GalleryItemRow = z.infer<typeof galleryItemRowSchema>;
export type AdminGalleryResponse = z.infer<typeof adminGalleryResponseSchema>;
export type PublicGalleryResponse = z.infer<typeof publicGalleryResponseSchema>;
export type CreateGalleryItemInput = z.infer<
  typeof createGalleryItemInputSchema
>;
export type UpdateGalleryItemInput = z.infer<
  typeof updateGalleryItemInputSchema
>;
export type DeleteGalleryItemInput = z.infer<
  typeof deleteGalleryItemInputSchema
>;
