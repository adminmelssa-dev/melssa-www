import "server-only";

import { desc, eq } from "drizzle-orm";
import type { AuditLogRow } from "@/modules/audit/contracts";
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
