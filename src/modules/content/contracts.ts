import { z } from "zod";

export const contentStatusSchema = z.union([
  z.literal("draft"),
  z.literal("published"),
  z.literal("archived"),
]);

export const eventStatusSchema = z.union([
  z.literal("draft"),
  z.literal("published"),
  z.literal("cancelled"),
]);

export type ContentStatus = z.infer<typeof contentStatusSchema>;
export type EventStatus = z.infer<typeof eventStatusSchema>;

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
};

export const CONTENT_STATUS_OPTIONS: {
  value: ContentStatus;
  label: string;
}[] = [
  { value: "draft", label: CONTENT_STATUS_LABELS.draft },
  { value: "published", label: CONTENT_STATUS_LABELS.published },
  { value: "archived", label: CONTENT_STATUS_LABELS.archived },
];

export const EVENT_STATUS_OPTIONS: {
  value: EventStatus;
  label: string;
}[] = [
  { value: "draft", label: EVENT_STATUS_LABELS.draft },
  { value: "published", label: EVENT_STATUS_LABELS.published },
  { value: "cancelled", label: EVENT_STATUS_LABELS.cancelled },
];

export function getNextContentPublishedAt({
  currentPublishedAt,
  nextStatus,
  previousStatus,
}: {
  currentPublishedAt: Date | null;
  nextStatus: ContentStatus;
  previousStatus: ContentStatus;
}): Date | null {
  if (nextStatus !== "published") return null;
  if (previousStatus === "published" && currentPublishedAt) {
    return currentPublishedAt;
  }

  return new Date();
}

export function getNextEventPublishedAt({
  currentPublishedAt,
  nextStatus,
  previousStatus,
}: {
  currentPublishedAt: Date | null;
  nextStatus: EventStatus;
  previousStatus: EventStatus;
}): Date | null {
  if (nextStatus !== "published") return null;
  if (previousStatus === "published" && currentPublishedAt) {
    return currentPublishedAt;
  }

  return new Date();
}
