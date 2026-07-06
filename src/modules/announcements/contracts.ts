import { z } from "zod";
import { contentStatusSchema } from "@/modules/content/contracts";
export {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_OPTIONS,
  contentStatusSchema,
  type ContentStatus,
} from "@/modules/content/contracts";

export const announcementCategorySchema = z.union([
  z.literal("general"),
  z.literal("academic"),
  z.literal("events"),
  z.literal("resources"),
  z.literal("welfare"),
]);

export type AnnouncementCategory = z.infer<typeof announcementCategorySchema>;

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<
  AnnouncementCategory,
  string
> = {
  general: "General",
  academic: "Academic",
  events: "Events",
  resources: "Resources",
  welfare: "Welfare",
};

export const ANNOUNCEMENT_CATEGORY_OPTIONS: {
  value: AnnouncementCategory;
  label: string;
}[] = [
  { value: "general", label: ANNOUNCEMENT_CATEGORY_LABELS.general },
  { value: "academic", label: ANNOUNCEMENT_CATEGORY_LABELS.academic },
  { value: "events", label: ANNOUNCEMENT_CATEGORY_LABELS.events },
  { value: "resources", label: ANNOUNCEMENT_CATEGORY_LABELS.resources },
  { value: "welfare", label: ANNOUNCEMENT_CATEGORY_LABELS.welfare },
];

const optionalTextSchema = (maxLength: number) =>
  z
    .union([z.string().trim().max(maxLength), z.null(), z.undefined()])
    .transform((value) => {
      if (typeof value !== "string" || value.length === 0) return null;
      return value;
    });

export const announcementAttachmentSchema = z.object({
  id: z.string(),
  publicUrl: z.url(),
  objectKey: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  byteSize: z.number().int().min(0),
});

export const announcementAuthorSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
  })
  .nullable();

export const announcementRowSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  summary: z.string().nullable(),
  body: z.string(),
  category: announcementCategorySchema,
  status: contentStatusSchema,
  author: announcementAuthorSchema,
  attachment: announcementAttachmentSchema.nullable(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminAnnouncementsResponseSchema = z.object({
  announcements: z.array(announcementRowSchema),
});

export const publicAnnouncementsResponseSchema = z.object({
  announcements: z.array(announcementRowSchema),
});

export const createAnnouncementInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Announcement title must be at least 2 characters.")
    .max(255, "Announcement title must be 255 characters or fewer."),
  summary: optionalTextSchema(500),
  body: z
    .string()
    .trim()
    .min(10, "Announcement body must be at least 10 characters.")
    .max(20_000, "Announcement body must be 20,000 characters or fewer."),
  category: announcementCategorySchema.default("general"),
  status: contentStatusSchema.default("draft"),
  attachmentStorageObjectId: z
    .union([z.string().min(1), z.null(), z.undefined()])
    .transform((value) => value ?? null),
});

export const updateAnnouncementInputSchema = createAnnouncementInputSchema.extend({
  announcementId: z.number().int().positive(),
});

export const deleteAnnouncementInputSchema = z.object({
  announcementId: z.number().int().positive(),
});

export type AnnouncementAttachment = z.infer<
  typeof announcementAttachmentSchema
>;
export type AnnouncementAuthor = z.infer<typeof announcementAuthorSchema>;
export type AnnouncementRow = z.infer<typeof announcementRowSchema>;
export type CreateAnnouncementInput = z.infer<
  typeof createAnnouncementInputSchema
>;
export type UpdateAnnouncementInput = z.infer<
  typeof updateAnnouncementInputSchema
>;
export type DeleteAnnouncementInput = z.infer<
  typeof deleteAnnouncementInputSchema
>;
export type AdminAnnouncementsResponse = z.infer<
  typeof adminAnnouncementsResponseSchema
>;
export type PublicAnnouncementsResponse = z.infer<
  typeof publicAnnouncementsResponseSchema
>;
