import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";

export const publicRateLimits = pgTable(
  "public_rate_limits",
  {
    key: text("key").primaryKey(),
    scope: varchar("scope", { length: 100 }).notNull(),
    count: integer("count").notNull().default(0),
    resetAt: timestamp("reset_at").notNull(),
    ...timestamps,
  },
  (table) => [
    index("public_rate_limits_scope_idx").on(table.scope),
    index("public_rate_limits_reset_at_idx").on(table.resetAt),
  ],
);
