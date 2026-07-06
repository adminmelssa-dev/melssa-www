import "server-only";

import {
  and,
  desc,
  eq,
  isNull,
} from "drizzle-orm";
import type {
  DashboardNotificationRow,
  DashboardNotificationsResponse,
} from "@/modules/notifications/contracts";
import { db } from "@/server/db";
import { dashboardNotifications } from "@/server/db/schema";

export interface DashboardNotificationListItem {
  id: number;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
}

const DEFAULT_NOTIFICATION_LIMIT = 12;

export async function getDashboardNotifications(
  userId: string,
): Promise<DashboardNotificationListItem[]> {
  return db
    .select({
      id: dashboardNotifications.id,
      type: dashboardNotifications.type,
      title: dashboardNotifications.title,
      body: dashboardNotifications.body,
      href: dashboardNotifications.href,
      readAt: dashboardNotifications.readAt,
      createdAt: dashboardNotifications.createdAt,
    })
    .from(dashboardNotifications)
    .where(eq(dashboardNotifications.userId, userId))
    .orderBy(desc(dashboardNotifications.createdAt))
    .limit(DEFAULT_NOTIFICATION_LIMIT);
}

export async function getUnreadDashboardNotificationCount(
  userId: string,
): Promise<number> {
  return db.$count(
    dashboardNotifications,
    and(
      eq(dashboardNotifications.userId, userId),
      isNull(dashboardNotifications.readAt),
    ),
  );
}

export function serializeDashboardNotification(
  notification: DashboardNotificationListItem,
): DashboardNotificationRow {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    href: notification.href,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function getSerializedDashboardNotifications(
  userId: string,
): Promise<DashboardNotificationsResponse> {
  const [notifications, unreadCount] = await Promise.all([
    getDashboardNotifications(userId),
    getUnreadDashboardNotificationCount(userId),
  ]);

  return {
    notifications: notifications.map((notification) =>
      serializeDashboardNotification(notification),
    ),
    unreadCount,
  };
}
