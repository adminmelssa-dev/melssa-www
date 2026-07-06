import "server-only";

import {
  and,
  eq,
  inArray,
  isNull,
  or,
} from "drizzle-orm";
import type { DashboardNotificationMutation } from "@/modules/notifications/contracts";
import type { UserRole } from "@/modules/auth/roles";
import { ExpectedError } from "@/lib/action-result";
import { db } from "@/server/db";
import {
  dashboardNotifications,
  user,
} from "@/server/db/schema";

interface CreateDashboardNotificationInput {
  body: string;
  href: string | null;
  title: string;
  type: string;
  userId: string;
}

interface CreateDashboardNotificationsForRolesInput {
  body: string;
  href: string | null;
  roles: readonly UserRole[];
  title: string;
  type: string;
}

export async function createDashboardNotification({
  body,
  href,
  title,
  type,
  userId,
}: CreateDashboardNotificationInput): Promise<void> {
  await db.insert(dashboardNotifications).values({
    body,
    href,
    title,
    type,
    userId,
  });
}

export async function createDashboardNotificationsForRoles({
  body,
  href,
  roles,
  title,
  type,
}: CreateDashboardNotificationsForRolesInput): Promise<void> {
  if (roles.length === 0) return;

  const recipients = await db
    .select({ id: user.id })
    .from(user)
    .where(
      and(
        inArray(user.role, roles),
        or(eq(user.banned, false), isNull(user.banned)),
      ),
    );

  if (recipients.length === 0) return;

  await db.insert(dashboardNotifications).values(
    recipients.map((recipient) => ({
      body,
      href,
      title,
      type,
      userId: recipient.id,
    })),
  );
}

export async function mutateDashboardNotification({
  mutation,
  userId,
}: {
  mutation: DashboardNotificationMutation;
  userId: string;
}): Promise<void> {
  if (mutation.type === "read-all") {
    await markAllDashboardNotificationsRead(userId);
    return;
  }

  await markDashboardNotificationRead({
    notificationId: mutation.notificationId,
    userId,
  });
}

async function markDashboardNotificationRead({
  notificationId,
  userId,
}: {
  notificationId: number;
  userId: string;
}): Promise<void> {
  const [updatedNotification] = await db
    .update(dashboardNotifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(dashboardNotifications.id, notificationId),
        eq(dashboardNotifications.userId, userId),
      ),
    )
    .returning({ id: dashboardNotifications.id });

  if (!updatedNotification) {
    throw new ExpectedError("Notification not found.");
  }
}

async function markAllDashboardNotificationsRead(userId: string): Promise<void> {
  await db
    .update(dashboardNotifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(dashboardNotifications.userId, userId),
        isNull(dashboardNotifications.readAt),
      ),
    );
}
