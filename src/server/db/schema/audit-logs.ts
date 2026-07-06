import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export type AuditLogMetadataValue = string | number | boolean | null;
export type AuditLogMetadata = Record<string, AuditLogMetadataValue>;

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    actorUserId: text("actor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: varchar("entity_id", { length: 100 }),
    summary: text("summary").notNull(),
    metadata: jsonb("metadata").$type<AuditLogMetadata>().notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_created_at_idx").on(table.createdAt),
    index("audit_logs_actor_user_id_idx").on(table.actorUserId),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  ],
);
