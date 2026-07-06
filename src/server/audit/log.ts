"use server";

import "server-only";

import { db } from "@/server/db";
import { auditLogs, type AuditLogMetadata } from "@/server/db/schema";

interface WriteAuditLogInput {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  summary: string;
  metadata?: AuditLogMetadata;
}

export async function writeAuditLog({
  actorUserId,
  action,
  entityType,
  entityId,
  summary,
  metadata,
}: WriteAuditLogInput): Promise<void> {
  await db.insert(auditLogs).values({
    actorUserId,
    action,
    entityType,
    entityId: entityId === undefined || entityId === null ? null : String(entityId),
    summary,
    metadata: metadata ?? {},
  });
}
