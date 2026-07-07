import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  or,
  type SQL,
} from "drizzle-orm";
import type {
  AuditLogFilterOptions,
  AuditLogRow,
} from "@/modules/audit/contracts";
import {
  createDataTablePage,
  getDataTableFilterValues,
  getDataTableOffset,
  type DataTablePage,
  type DataTableQuery,
} from "@/lib/data-table-query";
import { db } from "@/server/db";
import {
  auditLogs,
  type AuditLogMetadata,
  user,
} from "@/server/db/schema";

interface AuditLogListItem {
  id: number;
  actor: AuditLogRow["actor"];
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  metadata: AuditLogMetadata;
  createdAt: Date;
}

interface AuditLogQueryRow {
  id: number;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  metadata: AuditLogMetadata;
  createdAt: Date;
}

const DEFAULT_AUDIT_LOG_LIMIT = 500;

export interface AuditAdminStats {
  totalEntries: number;
  actorCount: number;
  actionCount: number;
  recentEntries: number;
}

export async function getAuditLogs(
  limit = DEFAULT_AUDIT_LOG_LIMIT,
): Promise<AuditLogListItem[]> {
  const rows = await db
    .select({
      id: auditLogs.id,
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      summary: auditLogs.summary,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(user, eq(user.id, auditLogs.actorUserId))
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(limit);

  return rows.map(mapAuditLogRow);
}

export function serializeAuditLog(item: AuditLogListItem): AuditLogRow {
  return {
    id: item.id,
    actor: item.actor,
    action: item.action,
    entityType: item.entityType,
    entityId: item.entityId,
    summary: item.summary,
    metadata: item.metadata,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function getSerializedAuditLogs(): Promise<AuditLogRow[]> {
  const rows = await getAuditLogs();
  return rows.map((item) => serializeAuditLog(item));
}

export async function getSerializedAuditLogPage(
  query: DataTableQuery,
): Promise<DataTablePage<AuditLogRow>> {
  const where = getAuditLogWhere(query);
  const [totalRow] = await db
    .select({ value: count() })
    .from(auditLogs)
    .leftJoin(user, eq(user.id, auditLogs.actorUserId))
    .where(where);
  const rows = await db
    .select({
      id: auditLogs.id,
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      summary: auditLogs.summary,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(user, eq(user.id, auditLogs.actorUserId))
    .where(where)
    .orderBy(...getAuditLogOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));

  return createDataTablePage({
    items: rows.map(mapAuditLogRow).map((item) => serializeAuditLog(item)),
    query,
    totalRows: totalRow?.value ?? 0,
  });
}

export async function getAuditAdminStats(): Promise<AuditAdminStats> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1_000);
  const [totalEntries, recentEntries, actorRows, actionRows] =
    await Promise.all([
      db.$count(auditLogs),
      db.$count(auditLogs, gte(auditLogs.createdAt, since)),
      db
        .selectDistinct({ actorUserId: auditLogs.actorUserId })
        .from(auditLogs)
        .where(isNotNull(auditLogs.actorUserId)),
      db.selectDistinct({ action: auditLogs.action }).from(auditLogs),
    ]);

  return {
    actionCount: actionRows.length,
    actorCount: actorRows.length,
    recentEntries,
    totalEntries,
  };
}

export async function getAuditLogFilterOptions(): Promise<AuditLogFilterOptions> {
  const [actions, entityTypes] = await Promise.all([
    db.selectDistinct({ value: auditLogs.action }).from(auditLogs),
    db.selectDistinct({ value: auditLogs.entityType }).from(auditLogs),
  ]);

  return {
    actions: actions
      .map((row) => row.value)
      .sort((first, second) => first.localeCompare(second))
      .map((value) => ({ label: formatOptionLabel(value), value })),
    entityTypes: entityTypes
      .map((row) => row.value)
      .sort((first, second) => first.localeCompare(second))
      .map((value) => ({ label: formatOptionLabel(value), value })),
  };
}

function mapAuditLogRow(row: AuditLogQueryRow): AuditLogListItem {
  return {
    id: row.id,
    actor:
      row.actorId && row.actorName && row.actorEmail
        ? {
            id: row.actorId,
            name: row.actorName,
            email: row.actorEmail,
          }
        : null,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    summary: row.summary,
    metadata: row.metadata,
    createdAt: row.createdAt,
  };
}

function getAuditLogWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const actionFilters = getDataTableFilterValues(query, "action");
  const entityFilters = getDataTableFilterValues(query, "entityType");

  if (actionFilters.length > 0) {
    conditions.push(inArray(auditLogs.action, actionFilters));
  }

  if (entityFilters.length > 0) {
    conditions.push(inArray(auditLogs.entityType, entityFilters));
  }

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(
      ilike(auditLogs.action, pattern),
      ilike(auditLogs.entityType, pattern),
      ilike(auditLogs.entityId, pattern),
      ilike(auditLogs.summary, pattern),
      ilike(user.name, pattern),
      ilike(user.email, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getAuditLogOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "action":
      return isAscending
        ? [asc(auditLogs.action), desc(auditLogs.id)]
        : [desc(auditLogs.action), desc(auditLogs.id)];
    case "actor":
      return isAscending
        ? [asc(user.email), desc(auditLogs.id)]
        : [desc(user.email), desc(auditLogs.id)];
    case "entityType":
      return isAscending
        ? [asc(auditLogs.entityType), desc(auditLogs.id)]
        : [desc(auditLogs.entityType), desc(auditLogs.id)];
    case "summary":
      return isAscending
        ? [asc(auditLogs.summary), desc(auditLogs.id)]
        : [desc(auditLogs.summary), desc(auditLogs.id)];
    default:
      return isAscending
        ? [asc(auditLogs.createdAt), asc(auditLogs.id)]
        : [desc(auditLogs.createdAt), desc(auditLogs.id)];
  }
}

function formatOptionLabel(value: string): string {
  return value.replaceAll("_", " ").replaceAll(".", " ");
}
