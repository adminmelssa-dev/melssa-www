import { z } from "zod";
import { eventStatusSchema } from "@/modules/content/contracts";
export {
  EVENT_STATUS_LABELS,
  EVENT_STATUS_OPTIONS,
  eventStatusSchema,
  type EventStatus,
} from "@/modules/content/contracts";

const optionalTextSchema = (maxLength: number) =>
  z
    .union([z.string().trim().max(maxLength), z.null(), z.undefined()])
    .transform((value) => {
      if (typeof value !== "string" || value.length === 0) return null;
      return value;
    });

const requiredDateTimeSchema = z
  .string()
  .trim()
  .min(1, "Event start date and time is required.")
  .refine(isValidDateValue, "Enter a valid event start date and time.")
  .transform((value) => new Date(value).toISOString());

const optionalDateTimeSchema = z
  .union([z.string().trim(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string" || value.length === 0) return null;
    return value;
  })
  .refine(
    (value) => value === null || isValidDateValue(value),
    "Enter a valid event end date and time.",
  )
  .transform((value) => (value === null ? null : new Date(value).toISOString()));

export const eventPosterSchema = z.object({
  id: z.string(),
  publicUrl: z.url(),
  objectKey: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  byteSize: z.number().int().min(0),
});

export const eventAuthorSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
  })
  .nullable();

export const eventRowSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string().nullable(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  location: z.string().nullable(),
  status: eventStatusSchema,
  author: eventAuthorSchema,
  poster: eventPosterSchema.nullable(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminEventsResponseSchema = z.object({
  events: z.array(eventRowSchema),
});

export const publicEventsResponseSchema = z.object({
  events: z.array(eventRowSchema),
});

const eventInputObjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Event title must be at least 2 characters.")
    .max(255, "Event title must be 255 characters or fewer."),
  description: optionalTextSchema(20_000),
  startsAt: requiredDateTimeSchema,
  endsAt: optionalDateTimeSchema,
  location: optionalTextSchema(255),
  status: eventStatusSchema.default("draft"),
  posterStorageObjectId: z
    .union([z.string().min(1), z.null(), z.undefined()])
    .transform((value) => value ?? null),
});

export const createEventInputSchema =
  eventInputObjectSchema.superRefine(validateEventDateRange);

export const updateEventInputSchema = eventInputObjectSchema
  .extend({
    eventId: z.number().int().positive(),
  })
  .superRefine(validateEventDateRange);

export const deleteEventInputSchema = z.object({
  eventId: z.number().int().positive(),
});

export type EventPoster = z.infer<typeof eventPosterSchema>;
export type EventAuthor = z.infer<typeof eventAuthorSchema>;
export type EventRow = z.infer<typeof eventRowSchema>;
export type CreateEventInput = z.infer<typeof createEventInputSchema>;
export type UpdateEventInput = z.infer<typeof updateEventInputSchema>;
export type DeleteEventInput = z.infer<typeof deleteEventInputSchema>;
export type AdminEventsResponse = z.infer<typeof adminEventsResponseSchema>;
export type PublicEventsResponse = z.infer<typeof publicEventsResponseSchema>;

function isValidDateValue(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function validateEventDateRange(
  value: {
    startsAt: string;
    endsAt: string | null;
  },
  context: z.RefinementCtx,
): void {
  if (!value.endsAt) return;

  if (new Date(value.endsAt).getTime() <= new Date(value.startsAt).getTime()) {
    context.addIssue({
      code: "custom",
      path: ["endsAt"],
      message: "Event end date and time must be after the start.",
    });
  }
}
