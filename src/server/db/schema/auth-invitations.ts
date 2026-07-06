import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { userRoleEnum } from "./enums";
import { timestamps } from "./helpers";

export const authInvitations = pgTable(
  "auth_invitations",
  {
    id: text("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    role: userRoleEnum().notNull(),
    tokenHash: text("token_hash").notNull(),
    invitedByUserId: text("invited_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    acceptedByUserId: text("accepted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    acceptedAt: timestamp("accepted_at"),
    revokedAt: timestamp("revoked_at"),
    expiresAt: timestamp("expires_at").notNull(),
    lastSentAt: timestamp("last_sent_at").notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    index("auth_invitations_email_idx").on(table.email),
    index("auth_invitations_invited_by_user_id_idx").on(table.invitedByUserId),
    index("auth_invitations_accepted_by_user_id_idx").on(
      table.acceptedByUserId,
    ),
    index("auth_invitations_expires_at_idx").on(table.expiresAt),
    uniqueIndex("auth_invitations_token_hash_unique").on(table.tokenHash),
  ],
);
