import "server-only";

import {
  and,
  eq,
  inArray,
  isNull,
  or,
} from "drizzle-orm";
import { z } from "zod";
import {
  ANNOUNCEMENT_CATEGORY_LABELS,
  type AnnouncementCategory,
} from "@/modules/announcements/contracts";
import {
  ACADEMIC_LEVEL_LABELS,
  SEMESTER_TERM_LABELS,
  type AcademicLevel,
  type SemesterTerm,
} from "@/modules/academics/contracts";
import { userRoleSchema } from "@/modules/auth/contracts";
import type { UserRole } from "@/modules/auth/roles";
import {
  CONCERN_CATEGORY_LABELS,
  type ConcernCategory,
} from "@/modules/concerns/contracts";
import {
  NOTIFICATION_EVENT_DEFINITIONS,
  type NotificationEventType,
} from "@/modules/settings/contracts";
import {
  RESOURCE_TYPE_LABELS,
  type ResourceType,
} from "@/modules/resources/contracts";
import { env } from "@/lib/env";
import { db } from "@/server/db";
import {
  notificationSettings,
  user,
} from "@/server/db/schema";
import { sendEmail } from "@/server/mail";
import {
  concernSubmittedTemplate,
  publishedAnnouncementTemplate,
  publishedEventTemplate,
  publishedResourceTemplate,
} from "@/server/mail/templates/notifications";
import type { MailDriver } from "@/server/mail/types";

interface NotificationDeliveryInput {
  eventType: NotificationEventType;
  subject: string;
  html: string;
}

export type NotificationDeliveryResult =
  | {
      status: "sent";
      eventType: NotificationEventType;
      provider: MailDriver;
      messageId: string | null;
      recipientCount: number;
    }
  | {
      status: "skipped";
      eventType: NotificationEventType;
      recipientCount: 0;
      reason: "no_recipients";
    }
  | {
      status: "failed";
      eventType: NotificationEventType;
      recipientCount: number;
    };

interface AnnouncementPublishedNotificationInput {
  title: string;
  category: AnnouncementCategory;
}

interface ResourcePublishedNotificationInput {
  title: string;
  type: ResourceType;
  level: AcademicLevel;
  semester: SemesterTerm;
}

interface EventPublishedNotificationInput {
  title: string;
  startsAt: string;
  location: string | null;
}

interface ConcernSubmittedNotificationInput {
  subject: string;
  category: ConcernCategory;
}

const emailSchema = z.email();
const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function notifyAnnouncementPublished(
  input: AnnouncementPublishedNotificationInput,
): Promise<NotificationDeliveryResult> {
  return sendNotification({
    eventType: "announcement.published",
    subject: `Announcement published: ${input.title}`,
    html: publishedAnnouncementTemplate({
      title: input.title,
      categoryLabel: ANNOUNCEMENT_CATEGORY_LABELS[input.category],
      dashboardUrl: appUrl("/dashboard/announcements"),
    }),
  });
}

export function notifyResourcePublished(
  input: ResourcePublishedNotificationInput,
): Promise<NotificationDeliveryResult> {
  return sendNotification({
    eventType: "resource.published",
    subject: `Resource published: ${input.title}`,
    html: publishedResourceTemplate({
      title: input.title,
      typeLabel: RESOURCE_TYPE_LABELS[input.type],
      levelLabel: ACADEMIC_LEVEL_LABELS[input.level],
      semesterLabel: SEMESTER_TERM_LABELS[input.semester],
      dashboardUrl: appUrl("/dashboard/resources"),
    }),
  });
}

export function notifyEventPublished(
  input: EventPublishedNotificationInput,
): Promise<NotificationDeliveryResult> {
  return sendNotification({
    eventType: "event.published",
    subject: `Event published: ${input.title}`,
    html: publishedEventTemplate({
      title: input.title,
      startsAtLabel: dateTimeFormatter.format(new Date(input.startsAt)),
      locationLabel: input.location ?? "Not specified",
      dashboardUrl: appUrl("/dashboard/events"),
    }),
  });
}

export function notifyConcernSubmitted(
  input: ConcernSubmittedNotificationInput,
): Promise<NotificationDeliveryResult> {
  return sendNotification({
    eventType: "concern.submitted",
    subject: `Concern submitted: ${input.subject}`,
    html: concernSubmittedTemplate({
      subject: input.subject,
      categoryLabel: CONCERN_CATEGORY_LABELS[input.category],
      dashboardUrl: appUrl("/dashboard/concerns"),
    }),
  });
}

async function sendNotification(
  input: NotificationDeliveryInput,
): Promise<NotificationDeliveryResult> {
  const recipients = await getNotificationRecipients(input.eventType);

  if (recipients.length === 0) {
    return {
      status: "skipped",
      eventType: input.eventType,
      recipientCount: 0,
      reason: "no_recipients",
    };
  }

  try {
    const result = await sendEmail({
      to: recipients,
      subject: input.subject,
      html: input.html,
    });

    return {
      status: "sent",
      eventType: input.eventType,
      provider: result.provider,
      messageId: result.messageId,
      recipientCount: recipients.length,
    };
  } catch (error) {
    console.error("Notification delivery failed.", {
      eventType: input.eventType,
      error,
    });

    return {
      status: "failed",
      eventType: input.eventType,
      recipientCount: recipients.length,
    };
  }
}

async function getNotificationRecipients(
  eventType: NotificationEventType,
): Promise<string[]> {
  const definition = getNotificationDefinition(eventType);
  const [setting] = await db
    .select({
      recipientEmails: notificationSettings.recipientEmails,
      recipientRoles: notificationSettings.recipientRoles,
    })
    .from(notificationSettings)
    .where(eq(notificationSettings.eventType, eventType))
    .limit(1);

  const emailByKey = new Map<string, string>();
  const recipientEmails = setting?.recipientEmails ?? [];
  const recipientRoles = setting
    ? normalizeRecipientRoles(setting.recipientRoles ?? [])
    : definition.defaultRoles;

  for (const email of recipientEmails) {
    addRecipient(emailByKey, email);
  }

  const roleRecipients = await getRoleRecipientEmails(recipientRoles);
  for (const email of roleRecipients) {
    addRecipient(emailByKey, email);
  }

  return Array.from(emailByKey.values()).sort((firstEmail, secondEmail) =>
    firstEmail.localeCompare(secondEmail),
  );
}

async function getRoleRecipientEmails(roles: UserRole[]): Promise<string[]> {
  if (roles.length === 0) return [];

  const rows = await db
    .select({ email: user.email })
    .from(user)
    .where(
      and(
        inArray(user.role, roles),
        or(eq(user.banned, false), isNull(user.banned)),
      ),
    );

  return rows.map((row) => row.email);
}

function normalizeRecipientRoles(values: readonly string[]): UserRole[] {
  const roles: UserRole[] = [];

  for (const value of values) {
    const parsedRole = userRoleSchema.safeParse(value);
    if (parsedRole.success) roles.push(parsedRole.data);
  }

  return roles;
}

function addRecipient(recipients: Map<string, string>, value: string): void {
  const email = value.trim();
  const parsedEmail = emailSchema.safeParse(email);

  if (!parsedEmail.success) return;

  recipients.set(email.toLowerCase(), email);
}

function getNotificationDefinition(eventType: NotificationEventType) {
  const definition = NOTIFICATION_EVENT_DEFINITIONS.find(
    (item) => item.eventType === eventType,
  );

  if (!definition) {
    throw new Error(`Unknown notification event type: ${eventType}`);
  }

  return definition;
}

function appUrl(path: `/${string}`): string {
  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString();
}
