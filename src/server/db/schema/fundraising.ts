import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  contentStatusEnum,
  fundraisingInquiryStatusEnum,
} from "./enums";
import { timestamps } from "./helpers";
import { storageObjects } from "./storage";

export interface FundraisingPaymentMethod {
  label: string;
  accountName: string | null;
  accountNumber: string | null;
  network: string | null;
  instructions: string | null;
}

export interface SponsorshipTier {
  name: string;
  amountLabel: string | null;
  benefits: string[];
}

export const fundraisingCampaigns = pgTable(
  "fundraising_campaigns",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    summary: text("summary"),
    body: text("body").notNull(),
    status: contentStatusEnum().notNull().default("draft"),
    goalAmountMinor: integer("goal_amount_minor"),
    currency: varchar("currency", { length: 3 }).notNull().default("GHS"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    paymentInstructions: text("payment_instructions"),
    paymentMethods: jsonb("payment_methods")
      .$type<FundraisingPaymentMethod[]>()
      .notNull()
      .default([]),
    sponsorshipTiers: jsonb("sponsorship_tiers")
      .$type<SponsorshipTier[]>()
      .notNull()
      .default([]),
    coverStorageObjectId: text("cover_storage_object_id").references(
      () => storageObjects.id,
      { onDelete: "set null" },
    ),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("fundraising_campaigns_slug_unique").on(table.slug),
    index("fundraising_campaigns_status_published_at_idx").on(
      table.status,
      table.publishedAt,
    ),
  ],
);

export const fundraisingInquiries = pgTable(
  "fundraising_inquiries",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    campaignId: integer("campaign_id").references(
      () => fundraisingCampaigns.id,
      { onDelete: "set null" },
    ),
    organizationName: varchar("organization_name", { length: 255 }),
    contactName: varchar("contact_name", { length: 255 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 80 }),
    message: text("message").notNull(),
    status: fundraisingInquiryStatusEnum().notNull().default("new"),
    reviewedByUserId: text("reviewed_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    internalNotes: text("internal_notes"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("fundraising_inquiries_campaign_idx").on(table.campaignId),
    index("fundraising_inquiries_status_created_at_idx").on(
      table.status,
      table.createdAt,
    ),
  ],
);
