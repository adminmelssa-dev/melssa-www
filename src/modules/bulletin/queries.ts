import "server-only";

import {
  desc,
  eq,
  isNull,
} from "drizzle-orm";
import type {
  BulletinDeliveryRow,
  BulletinIssueRow,
  BulletinIssueStatus,
} from "@/modules/bulletin/contracts";
import { db } from "@/server/db";
import {
  bulletinDeliveries,
  bulletinIssues,
  bulletinSubscriptions,
} from "@/server/db/schema";

export interface BulletinIssueListItem {
  id: number;
  title: string;
  subject: string;
  previewText: string | null;
  editorNote: string;
  sections: BulletinIssueRow["sections"];
  audienceTags: string[];
  status: BulletinIssueStatus;
  createdById: string | null;
  updatedById: string | null;
  sentById: string | null;
  sentAt: Date | null;
  archivedAt: Date | null;
  recipientCount: number;
  deliverySuccessCount: number;
  deliveryFailureCount: number;
  lastDeliveryError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulletinDeliveryListItem {
  id: number;
  email: string;
  status: BulletinDeliveryRow["status"];
  provider: string | null;
  messageId: string | null;
  errorMessage: string | null;
  sentAt: Date | null;
  createdAt: Date;
}

export async function getBulletinIssues(): Promise<BulletinIssueListItem[]> {
  const rows = await db
    .select({
      id: bulletinIssues.id,
      title: bulletinIssues.title,
      subject: bulletinIssues.subject,
      previewText: bulletinIssues.previewText,
      editorNote: bulletinIssues.editorNote,
      sections: bulletinIssues.sections,
      audienceTags: bulletinIssues.audienceTags,
      status: bulletinIssues.status,
      createdById: bulletinIssues.createdById,
      updatedById: bulletinIssues.updatedById,
      sentById: bulletinIssues.sentById,
      sentAt: bulletinIssues.sentAt,
      archivedAt: bulletinIssues.archivedAt,
      recipientCount: bulletinIssues.recipientCount,
      deliverySuccessCount: bulletinIssues.deliverySuccessCount,
      deliveryFailureCount: bulletinIssues.deliveryFailureCount,
      lastDeliveryError: bulletinIssues.lastDeliveryError,
      createdAt: bulletinIssues.createdAt,
      updatedAt: bulletinIssues.updatedAt,
    })
    .from(bulletinIssues)
    .orderBy(desc(bulletinIssues.createdAt));

  return rows;
}

export function serializeBulletinIssue(
  issue: BulletinIssueListItem,
): BulletinIssueRow {
  return {
    id: issue.id,
    title: issue.title,
    subject: issue.subject,
    previewText: issue.previewText,
    editorNote: issue.editorNote,
    sections: issue.sections,
    audienceTags: issue.audienceTags,
    status: issue.status,
    createdById: issue.createdById,
    updatedById: issue.updatedById,
    sentById: issue.sentById,
    sentAt: issue.sentAt?.toISOString() ?? null,
    archivedAt: issue.archivedAt?.toISOString() ?? null,
    recipientCount: issue.recipientCount,
    deliverySuccessCount: issue.deliverySuccessCount,
    deliveryFailureCount: issue.deliveryFailureCount,
    lastDeliveryError: issue.lastDeliveryError,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
  };
}

export async function getSerializedBulletinIssues(): Promise<
  BulletinIssueRow[]
> {
  const issues = await getBulletinIssues();
  return issues.map((issue) => serializeBulletinIssue(issue));
}

export async function getActiveBulletinSubscriberCount(): Promise<number> {
  const rows = await db
    .select({ id: bulletinSubscriptions.id })
    .from(bulletinSubscriptions)
    .where(isNull(bulletinSubscriptions.unsubscribedAt));

  return rows.length;
}

export async function getSerializedAdminBulletins(): Promise<{
  bulletins: BulletinIssueRow[];
  subscriberCount: number;
}> {
  const [bulletins, subscriberCount] = await Promise.all([
    getSerializedBulletinIssues(),
    getActiveBulletinSubscriberCount(),
  ]);

  return { bulletins, subscriberCount };
}

export async function getSerializedBulletinDeliveries(
  bulletinId: number,
): Promise<BulletinDeliveryRow[]> {
  const rows = await db
    .select({
      id: bulletinDeliveries.id,
      email: bulletinDeliveries.email,
      status: bulletinDeliveries.status,
      provider: bulletinDeliveries.provider,
      messageId: bulletinDeliveries.messageId,
      errorMessage: bulletinDeliveries.errorMessage,
      sentAt: bulletinDeliveries.sentAt,
      createdAt: bulletinDeliveries.createdAt,
    })
    .from(bulletinDeliveries)
    .where(eq(bulletinDeliveries.issueId, bulletinId))
    .orderBy(desc(bulletinDeliveries.createdAt));

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    status: row.status,
    provider: row.provider,
    messageId: row.messageId,
    errorMessage: row.errorMessage,
    sentAt: row.sentAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getActiveBulletinSubscriptions(): Promise<
  { id: string; email: string }[]
> {
  return db
    .select({
      id: bulletinSubscriptions.id,
      email: bulletinSubscriptions.email,
    })
    .from(bulletinSubscriptions)
    .where(isNull(bulletinSubscriptions.unsubscribedAt))
    .orderBy(bulletinSubscriptions.email);
}

export async function getBulletinSubscriptionById(subscriptionId: string) {
  const [subscription] = await db
    .select({
      id: bulletinSubscriptions.id,
      email: bulletinSubscriptions.email,
      unsubscribedAt: bulletinSubscriptions.unsubscribedAt,
    })
    .from(bulletinSubscriptions)
    .where(eq(bulletinSubscriptions.id, subscriptionId))
    .limit(1);

  return subscription ?? null;
}

export async function getActiveBulletinIssueById(bulletinId: number) {
  const [issue] = await db
    .select({
      id: bulletinIssues.id,
      title: bulletinIssues.title,
      subject: bulletinIssues.subject,
      previewText: bulletinIssues.previewText,
      editorNote: bulletinIssues.editorNote,
      sections: bulletinIssues.sections,
      audienceTags: bulletinIssues.audienceTags,
      status: bulletinIssues.status,
      createdById: bulletinIssues.createdById,
      updatedById: bulletinIssues.updatedById,
      sentById: bulletinIssues.sentById,
      sentAt: bulletinIssues.sentAt,
      archivedAt: bulletinIssues.archivedAt,
      recipientCount: bulletinIssues.recipientCount,
      deliverySuccessCount: bulletinIssues.deliverySuccessCount,
      deliveryFailureCount: bulletinIssues.deliveryFailureCount,
      lastDeliveryError: bulletinIssues.lastDeliveryError,
      createdAt: bulletinIssues.createdAt,
      updatedAt: bulletinIssues.updatedAt,
    })
    .from(bulletinIssues)
    .where(eq(bulletinIssues.id, bulletinId))
    .limit(1);

  return issue ?? null;
}
