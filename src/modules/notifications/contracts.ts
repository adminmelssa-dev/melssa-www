import { z } from "zod";

export const dashboardNotificationRowSchema = z.object({
  id: z.number(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  href: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});

export const dashboardNotificationsResponseSchema = z.object({
  notifications: z.array(dashboardNotificationRowSchema),
  unreadCount: z.number(),
});

export const dashboardNotificationMutationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("read"),
    notificationId: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("read-all"),
  }),
]);

export type DashboardNotificationRow = z.infer<
  typeof dashboardNotificationRowSchema
>;
export type DashboardNotificationsResponse = z.infer<
  typeof dashboardNotificationsResponseSchema
>;
export type DashboardNotificationMutation = z.infer<
  typeof dashboardNotificationMutationSchema
>;
