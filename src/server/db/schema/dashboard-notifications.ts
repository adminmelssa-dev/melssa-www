import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const dashboardNotifications = pgTable(
  "dashboard_notifications",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 100 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    body: text("body").notNull(),
    href: varchar("href", { length: 500 }),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("dashboard_notifications_user_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
    index("dashboard_notifications_user_read_at_idx").on(
      table.userId,
      table.readAt,
    ),
  ],
);
