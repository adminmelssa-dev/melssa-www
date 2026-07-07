import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  type SQL,
} from "drizzle-orm";
import type {
  BulletinDeliveryRow,
  BulletinDeliveryStatus,
  BulletinIssueRow,
  BulletinIssueStatus,
} from "@/modules/bulletin/contracts";
import {
  bulletinDeliveryStatusSchema,
  bulletinIssueStatusSchema,
} from "@/modules/bulletin/contracts";
import {
  createDataTablePage,
  getDataTableFilterValues,
  getDataTableOffset,
  type DataTablePage,
  type DataTableQuery,
} from "@/lib/data-table-query";
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

export interface BulletinsAdminStats {
  subscribers: number;
  drafts: number;
  sent: number;
  deliveryIssues: number;
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

export async function getSerializedBulletinIssuePage(
  query: DataTableQuery,
): Promise<DataTablePage<BulletinIssueRow>> {
  const where = getBulletinIssueWhere(query);
  const totalRows = await db.$count(bulletinIssues, where);
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
    .where(where)
    .orderBy(...getBulletinIssueOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));

  return createDataTablePage({
    items: rows.map((issue) => serializeBulletinIssue(issue)),
    query,
    totalRows,
  });
}

export async function getActiveBulletinSubscriberCount(): Promise<number> {
  return db.$count(
    bulletinSubscriptions,
    isNull(bulletinSubscriptions.unsubscribedAt),
  );
}

export async function getBulletinsAdminStats(): Promise<BulletinsAdminStats> {
  const [subscribers, drafts, sent, deliveryIssues] = await Promise.all([
    getActiveBulletinSubscriberCount(),
    db.$count(bulletinIssues, eq(bulletinIssues.status, "draft")),
    db.$count(bulletinIssues, eq(bulletinIssues.status, "sent")),
    db.$count(bulletinIssues, gt(bulletinIssues.deliveryFailureCount, 0)),
  ]);

  return {
    deliveryIssues,
    drafts,
    sent,
    subscribers,
  };
}

export async function getSerializedAdminBulletins(): Promise<{
  bulletins: BulletinIssueRow[];
  meta: DataTablePage<BulletinIssueRow>["meta"];
  subscriberCount: number;
}> {
  const [bulletinPage, subscriberCount] = await Promise.all([
    getSerializedBulletinIssuePage({
      filters: [],
      pageIndex: 0,
      pageSize: 10,
      search: "",
      sortBy: null,
      sortDirection: null,
    }),
    getActiveBulletinSubscriberCount(),
  ]);

  return {
    bulletins: bulletinPage.items,
    meta: bulletinPage.meta,
    subscriberCount,
  };
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

export async function getSerializedBulletinDeliveryPage(
  bulletinId: number,
  query: DataTableQuery,
): Promise<DataTablePage<BulletinDeliveryRow>> {
  const where = getBulletinDeliveryWhere(bulletinId, query);
  const [totalRow] = await db
    .select({ value: count() })
    .from(bulletinDeliveries)
    .where(where);
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
    .where(where)
    .orderBy(...getBulletinDeliveryOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));

  return createDataTablePage({
    items: rows.map((row) => ({
      id: row.id,
      email: row.email,
      status: row.status,
      provider: row.provider,
      messageId: row.messageId,
      errorMessage: row.errorMessage,
      sentAt: row.sentAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
    query,
    totalRows: totalRow?.value ?? 0,
  });
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

function getBulletinIssueWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const statusFilters = getValidIssueStatusFilters(
    getDataTableFilterValues(query, "status"),
  );
  const deliveryFilters = getDataTableFilterValues(query, "deliveryHealth");

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(
      ilike(bulletinIssues.title, pattern),
      ilike(bulletinIssues.subject, pattern),
      ilike(bulletinIssues.previewText, pattern),
      ilike(bulletinIssues.editorNote, pattern),
      ilike(bulletinIssues.lastDeliveryError, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (statusFilters.length > 0) {
    conditions.push(inArray(bulletinIssues.status, statusFilters));
  }

  const deliveryCondition = getDeliveryHealthCondition(deliveryFilters);
  if (deliveryCondition) conditions.push(deliveryCondition);

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getBulletinDeliveryWhere(
  bulletinId: number,
  query: DataTableQuery,
): SQL | undefined {
  const conditions: SQL[] = [eq(bulletinDeliveries.issueId, bulletinId)];
  const statusFilters = getValidDeliveryStatusFilters(
    getDataTableFilterValues(query, "status"),
  );

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(
      ilike(bulletinDeliveries.email, pattern),
      ilike(bulletinDeliveries.provider, pattern),
      ilike(bulletinDeliveries.messageId, pattern),
      ilike(bulletinDeliveries.errorMessage, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (statusFilters.length > 0) {
    conditions.push(inArray(bulletinDeliveries.status, statusFilters));
  }

  return and(...conditions);
}

function getBulletinIssueOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "title":
      return isAscending
        ? [asc(bulletinIssues.title), asc(bulletinIssues.id)]
        : [desc(bulletinIssues.title), desc(bulletinIssues.id)];
    case "status":
      return isAscending
        ? [asc(bulletinIssues.status), desc(bulletinIssues.id)]
        : [desc(bulletinIssues.status), desc(bulletinIssues.id)];
    case "sentAt":
      return isAscending
        ? [asc(bulletinIssues.sentAt), asc(bulletinIssues.id)]
        : [desc(bulletinIssues.sentAt), desc(bulletinIssues.id)];
    case "updatedAt":
      return isAscending
        ? [asc(bulletinIssues.updatedAt), asc(bulletinIssues.id)]
        : [desc(bulletinIssues.updatedAt), desc(bulletinIssues.id)];
    default:
      return isAscending
        ? [asc(bulletinIssues.createdAt), asc(bulletinIssues.id)]
        : [desc(bulletinIssues.createdAt), desc(bulletinIssues.id)];
  }
}

function getBulletinDeliveryOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "email":
      return isAscending
        ? [asc(bulletinDeliveries.email), asc(bulletinDeliveries.id)]
        : [desc(bulletinDeliveries.email), desc(bulletinDeliveries.id)];
    case "status":
      return isAscending
        ? [asc(bulletinDeliveries.status), desc(bulletinDeliveries.id)]
        : [desc(bulletinDeliveries.status), desc(bulletinDeliveries.id)];
    case "provider":
      return isAscending
        ? [asc(bulletinDeliveries.provider), desc(bulletinDeliveries.id)]
        : [desc(bulletinDeliveries.provider), desc(bulletinDeliveries.id)];
    case "sentAt":
      return isAscending
        ? [asc(bulletinDeliveries.sentAt), asc(bulletinDeliveries.id)]
        : [desc(bulletinDeliveries.sentAt), desc(bulletinDeliveries.id)];
    default:
      return isAscending
        ? [asc(bulletinDeliveries.createdAt), asc(bulletinDeliveries.id)]
        : [desc(bulletinDeliveries.createdAt), desc(bulletinDeliveries.id)];
  }
}

function getValidIssueStatusFilters(values: string[]): BulletinIssueStatus[] {
  return values.flatMap((value) => {
    const parsedValue = bulletinIssueStatusSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}

function getValidDeliveryStatusFilters(
  values: string[],
): BulletinDeliveryStatus[] {
  return values.flatMap((value) => {
    const parsedValue = bulletinDeliveryStatusSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}

function getDeliveryHealthCondition(values: string[]): SQL | undefined {
  if (values.length === 0) return undefined;

  const conditions = values.flatMap((value) => {
    if (value === "clean") {
      return [
        and(
          eq(bulletinIssues.status, "sent"),
          eq(bulletinIssues.deliveryFailureCount, 0),
        ),
      ];
    }
    if (value === "issues") {
      return [gt(bulletinIssues.deliveryFailureCount, 0)];
    }
    if (value === "not_sent") return [ne(bulletinIssues.status, "sent")];
    return [];
  });

  return or(...conditions);
}
