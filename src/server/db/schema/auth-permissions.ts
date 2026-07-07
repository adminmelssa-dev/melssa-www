import {
  index,
  integer,
  pgTable,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { timestamps } from "./helpers";

export const userPermissionGrants = pgTable(
  "user_permission_grants",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    resource: varchar("resource", { length: 80 }).notNull(),
    action: varchar("action", { length: 80 }).notNull(),
    grantedByUserId: text("granted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    unique("user_permission_grants_user_resource_action_unique").on(
      table.userId,
      table.resource,
      table.action,
    ),
    index("user_permission_grants_user_idx").on(table.userId),
    index("user_permission_grants_permission_idx").on(
      table.resource,
      table.action,
    ),
  ],
);
