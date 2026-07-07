import "server-only";

import {
  and,
  desc,
  eq,
} from "drizzle-orm";
import { z } from "zod";
import {
  fundraisingCampaignRowSchema,
  type FundraisingCampaignRow,
  type FundraisingInquiryRow,
} from "@/modules/fundraising/contracts";
import { db } from "@/server/db";
import {
  fundraisingCampaigns,
  fundraisingInquiries,
  storageObjects,
  user,
} from "@/server/db/schema";
import {
  getCachedJson,
  PUBLIC_CACHE_KEYS,
  PUBLIC_CACHE_TTL_SECONDS,
} from "@/server/cache";

interface FundraisingCampaignListItem {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  status: FundraisingCampaignRow["status"];
  goalAmountMinor: number | null;
  currency: string;
  startsAt: Date | null;
  endsAt: Date | null;
  paymentInstructions: string | null;
  paymentMethods: FundraisingCampaignRow["paymentMethods"];
  sponsorshipTiers: FundraisingCampaignRow["sponsorshipTiers"];
  cover: FundraisingCampaignRow["cover"];
  creator: FundraisingCampaignRow["creator"];
  inquiryCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FundraisingCampaignQueryRow {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  status: FundraisingCampaignRow["status"];
  goalAmountMinor: number | null;
  currency: string;
  startsAt: Date | null;
  endsAt: Date | null;
  paymentInstructions: string | null;
  paymentMethods: FundraisingCampaignRow["paymentMethods"];
  sponsorshipTiers: FundraisingCampaignRow["sponsorshipTiers"];
  coverId: string | null;
  coverPublicUrl: string | null;
  coverObjectKey: string | null;
  coverOriginalFilename: string | null;
  creatorId: string | null;
  creatorName: string | null;
  creatorEmail: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FundraisingInquiryListItem {
  id: number;
  campaign: FundraisingInquiryRow["campaign"];
  organizationName: string | null;
  contactName: string;
  contactEmail: string;
  phone: string | null;
  message: string;
  status: FundraisingInquiryRow["status"];
  internalNotes: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FundraisingInquiryQueryRow {
  id: number;
  campaignId: number | null;
  campaignTitle: string | null;
  organizationName: string | null;
  contactName: string;
  contactEmail: string;
  phone: string | null;
  message: string;
  status: FundraisingInquiryRow["status"];
  internalNotes: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getFundraisingCampaigns(): Promise<
  FundraisingCampaignListItem[]
> {
  const [rows, inquiryCounts] = await Promise.all([
    fundraisingCampaignSelect()
      .from(fundraisingCampaigns)
      .leftJoin(
        storageObjects,
        and(
          eq(storageObjects.id, fundraisingCampaigns.coverStorageObjectId),
          eq(storageObjects.status, "completed"),
        ),
      )
      .leftJoin(user, eq(user.id, fundraisingCampaigns.createdById))
      .orderBy(
        desc(fundraisingCampaigns.publishedAt),
        desc(fundraisingCampaigns.createdAt),
      ),
    getInquiryCountsByCampaignId(),
  ]);

  return rows.map((row) =>
    mapFundraisingCampaignRow(row, inquiryCounts.get(row.id) ?? 0),
  );
}

export async function getPublishedFundraisingCampaigns(): Promise<
  FundraisingCampaignListItem[]
> {
  const campaigns = await getFundraisingCampaigns();
  return campaigns.filter((campaign) => campaign.status === "published");
}

export async function getFundraisingInquiries(): Promise<
  FundraisingInquiryListItem[]
> {
  const rows = await db
    .select({
      id: fundraisingInquiries.id,
      campaignId: fundraisingCampaigns.id,
      campaignTitle: fundraisingCampaigns.title,
      organizationName: fundraisingInquiries.organizationName,
      contactName: fundraisingInquiries.contactName,
      contactEmail: fundraisingInquiries.contactEmail,
      phone: fundraisingInquiries.phone,
      message: fundraisingInquiries.message,
      status: fundraisingInquiries.status,
      internalNotes: fundraisingInquiries.internalNotes,
      reviewedAt: fundraisingInquiries.reviewedAt,
      createdAt: fundraisingInquiries.createdAt,
      updatedAt: fundraisingInquiries.updatedAt,
    })
    .from(fundraisingInquiries)
    .leftJoin(
      fundraisingCampaigns,
      eq(fundraisingCampaigns.id, fundraisingInquiries.campaignId),
    )
    .orderBy(desc(fundraisingInquiries.createdAt));

  return rows.map(mapFundraisingInquiryRow);
}

export function serializeFundraisingCampaign(
  item: FundraisingCampaignListItem,
): FundraisingCampaignRow {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    body: item.body,
    status: item.status,
    goalAmountMinor: item.goalAmountMinor,
    currency: item.currency,
    startsAt: item.startsAt?.toISOString() ?? null,
    endsAt: item.endsAt?.toISOString() ?? null,
    paymentInstructions: item.paymentInstructions,
    paymentMethods: item.paymentMethods,
    sponsorshipTiers: item.sponsorshipTiers,
    cover: item.cover,
    creator: item.creator,
    inquiryCount: item.inquiryCount,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function serializeFundraisingInquiry(
  item: FundraisingInquiryListItem,
): FundraisingInquiryRow {
  return {
    id: item.id,
    campaign: item.campaign,
    organizationName: item.organizationName,
    contactName: item.contactName,
    contactEmail: item.contactEmail,
    phone: item.phone,
    message: item.message,
    status: item.status,
    internalNotes: item.internalNotes,
    reviewedAt: item.reviewedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getSerializedFundraisingCampaigns(): Promise<
  FundraisingCampaignRow[]
> {
  const campaigns = await getFundraisingCampaigns();
  return campaigns.map((campaign) => serializeFundraisingCampaign(campaign));
}

export async function getSerializedPublishedFundraisingCampaigns(): Promise<
  FundraisingCampaignRow[]
> {
  return getCachedJson({
    key: PUBLIC_CACHE_KEYS.fundraising,
    load: async () => {
      const campaigns = await getPublishedFundraisingCampaigns();
      return campaigns.map((campaign) => serializeFundraisingCampaign(campaign));
    },
    schema: z.array(fundraisingCampaignRowSchema),
    ttlSeconds: PUBLIC_CACHE_TTL_SECONDS,
  });
}

export async function getSerializedFundraisingInquiries(): Promise<
  FundraisingInquiryRow[]
> {
  const inquiries = await getFundraisingInquiries();
  return inquiries.map((inquiry) => serializeFundraisingInquiry(inquiry));
}

function fundraisingCampaignSelect() {
  return db.select({
    id: fundraisingCampaigns.id,
    title: fundraisingCampaigns.title,
    slug: fundraisingCampaigns.slug,
    summary: fundraisingCampaigns.summary,
    body: fundraisingCampaigns.body,
    status: fundraisingCampaigns.status,
    goalAmountMinor: fundraisingCampaigns.goalAmountMinor,
    currency: fundraisingCampaigns.currency,
    startsAt: fundraisingCampaigns.startsAt,
    endsAt: fundraisingCampaigns.endsAt,
    paymentInstructions: fundraisingCampaigns.paymentInstructions,
    paymentMethods: fundraisingCampaigns.paymentMethods,
    sponsorshipTiers: fundraisingCampaigns.sponsorshipTiers,
    coverId: storageObjects.id,
    coverPublicUrl: storageObjects.publicUrl,
    coverObjectKey: storageObjects.objectKey,
    coverOriginalFilename: storageObjects.originalFilename,
    creatorId: user.id,
    creatorName: user.name,
    creatorEmail: user.email,
    publishedAt: fundraisingCampaigns.publishedAt,
    createdAt: fundraisingCampaigns.createdAt,
    updatedAt: fundraisingCampaigns.updatedAt,
  });
}

async function getInquiryCountsByCampaignId(): Promise<Map<number, number>> {
  const inquiries = await db
    .select({ campaignId: fundraisingInquiries.campaignId })
    .from(fundraisingInquiries);
  const counts = new Map<number, number>();

  for (const inquiry of inquiries) {
    if (inquiry.campaignId === null) continue;
    counts.set(inquiry.campaignId, (counts.get(inquiry.campaignId) ?? 0) + 1);
  }

  return counts;
}

function mapFundraisingCampaignRow(
  row: FundraisingCampaignQueryRow,
  inquiryCount: number,
): FundraisingCampaignListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    body: row.body,
    status: row.status,
    goalAmountMinor: row.goalAmountMinor,
    currency: row.currency,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    paymentInstructions: row.paymentInstructions,
    paymentMethods: row.paymentMethods,
    sponsorshipTiers: row.sponsorshipTiers,
    cover:
      row.coverId &&
      row.coverPublicUrl &&
      row.coverObjectKey &&
      row.coverOriginalFilename
        ? {
            id: row.coverId,
            publicUrl: row.coverPublicUrl,
            objectKey: row.coverObjectKey,
            originalFilename: row.coverOriginalFilename,
          }
        : null,
    creator:
      row.creatorId && row.creatorName && row.creatorEmail
        ? {
            id: row.creatorId,
            name: row.creatorName,
            email: row.creatorEmail,
          }
        : null,
    inquiryCount,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapFundraisingInquiryRow(
  row: FundraisingInquiryQueryRow,
): FundraisingInquiryListItem {
  return {
    id: row.id,
    campaign:
      row.campaignId && row.campaignTitle
        ? {
            id: row.campaignId,
            title: row.campaignTitle,
          }
        : null,
    organizationName: row.organizationName,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    phone: row.phone,
    message: row.message,
    status: row.status,
    internalNotes: row.internalNotes,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
