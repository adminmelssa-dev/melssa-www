import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import { contentStatusSchema } from "@/modules/content/contracts";
import {
  fundraisingCampaignRowSchema,
  fundraisingInquiryStatusSchema,
  type FundraisingCampaignRow,
  type FundraisingInquiryStatus,
  type FundraisingInquiryRow,
} from "@/modules/fundraising/contracts";
import {
  createDataTablePage,
  getDataTableFilterValues,
  getDataTableOffset,
  type DataTablePage,
  type DataTableQuery,
} from "@/lib/data-table-query";
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

export interface FundraisingAdminStats {
  campaigns: number;
  publishedCampaigns: number;
  inquiries: number;
  openInquiries: number;
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

export async function getSerializedFundraisingCampaignPage(
  query: DataTableQuery,
): Promise<DataTablePage<FundraisingCampaignRow>> {
  const where = getFundraisingCampaignWhere(query);
  const totalRows = await db.$count(fundraisingCampaigns, where);
  const rows = await fundraisingCampaignSelect()
    .from(fundraisingCampaigns)
    .leftJoin(
      storageObjects,
      and(
        eq(storageObjects.id, fundraisingCampaigns.coverStorageObjectId),
        eq(storageObjects.status, "completed"),
      ),
    )
    .leftJoin(user, eq(user.id, fundraisingCampaigns.createdById))
    .where(where)
    .orderBy(...getFundraisingCampaignOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));
  const inquiryCounts = await getInquiryCountsByCampaignId(
    rows.map((row) => row.id),
  );

  return createDataTablePage({
    items: rows
      .map((row) =>
        mapFundraisingCampaignRow(row, inquiryCounts.get(row.id) ?? 0),
      )
      .map((campaign) => serializeFundraisingCampaign(campaign)),
    query,
    totalRows,
  });
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

export async function getSerializedFundraisingInquiryPage(
  query: DataTableQuery,
): Promise<DataTablePage<FundraisingInquiryRow>> {
  const where = getFundraisingInquiryWhere(query);
  const [totalRow] = await db
    .select({ value: count() })
    .from(fundraisingInquiries)
    .leftJoin(
      fundraisingCampaigns,
      eq(fundraisingCampaigns.id, fundraisingInquiries.campaignId),
    )
    .where(where);
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
    .where(where)
    .orderBy(...getFundraisingInquiryOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));

  return createDataTablePage({
    items: rows
      .map(mapFundraisingInquiryRow)
      .map((inquiry) => serializeFundraisingInquiry(inquiry)),
    query,
    totalRows: totalRow?.value ?? 0,
  });
}

export async function getFundraisingAdminStats(): Promise<FundraisingAdminStats> {
  const [campaigns, publishedCampaigns, inquiries, openInquiries] =
    await Promise.all([
      db.$count(fundraisingCampaigns),
      db.$count(fundraisingCampaigns, eq(fundraisingCampaigns.status, "published")),
      db.$count(fundraisingInquiries),
      db.$count(
        fundraisingInquiries,
        inArray(fundraisingInquiries.status, ["new", "reviewing"]),
      ),
    ]);

  return {
    campaigns,
    inquiries,
    openInquiries,
    publishedCampaigns,
  };
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

async function getInquiryCountsByCampaignId(
  campaignIds?: number[],
): Promise<Map<number, number>> {
  if (campaignIds && campaignIds.length === 0) return new Map();

  const inquiries = await db
    .select({
      campaignId: fundraisingInquiries.campaignId,
      value: count(),
    })
    .from(fundraisingInquiries)
    .where(
      campaignIds
        ? inArray(fundraisingInquiries.campaignId, campaignIds)
        : undefined,
    )
    .groupBy(fundraisingInquiries.campaignId);
  const counts = new Map<number, number>();

  for (const inquiry of inquiries) {
    if (inquiry.campaignId === null) continue;
    counts.set(inquiry.campaignId, inquiry.value);
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

function getFundraisingCampaignWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const statusFilters = getValidContentStatusFilters(
    getDataTableFilterValues(query, "status"),
  );

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(
      ilike(fundraisingCampaigns.title, pattern),
      ilike(fundraisingCampaigns.slug, pattern),
      ilike(fundraisingCampaigns.summary, pattern),
      ilike(fundraisingCampaigns.body, pattern),
      ilike(fundraisingCampaigns.paymentInstructions, pattern),
      ilike(user.name, pattern),
      ilike(user.email, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (statusFilters.length > 0) {
    conditions.push(inArray(fundraisingCampaigns.status, statusFilters));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getFundraisingInquiryWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const statusFilters = getValidInquiryStatusFilters(
    getDataTableFilterValues(query, "status"),
  );

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(
      ilike(fundraisingInquiries.organizationName, pattern),
      ilike(fundraisingInquiries.contactName, pattern),
      ilike(fundraisingInquiries.contactEmail, pattern),
      ilike(fundraisingInquiries.phone, pattern),
      ilike(fundraisingInquiries.message, pattern),
      ilike(fundraisingCampaigns.title, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (statusFilters.length > 0) {
    conditions.push(inArray(fundraisingInquiries.status, statusFilters));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getFundraisingCampaignOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "title":
      return isAscending
        ? [asc(fundraisingCampaigns.title), asc(fundraisingCampaigns.id)]
        : [desc(fundraisingCampaigns.title), desc(fundraisingCampaigns.id)];
    case "status":
      return isAscending
        ? [asc(fundraisingCampaigns.status), desc(fundraisingCampaigns.id)]
        : [desc(fundraisingCampaigns.status), desc(fundraisingCampaigns.id)];
    case "updatedAt":
      return isAscending
        ? [asc(fundraisingCampaigns.updatedAt), asc(fundraisingCampaigns.id)]
        : [desc(fundraisingCampaigns.updatedAt), desc(fundraisingCampaigns.id)];
    default:
      return [
        desc(fundraisingCampaigns.publishedAt),
        desc(fundraisingCampaigns.createdAt),
      ];
  }
}

function getFundraisingInquiryOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "contactName":
      return isAscending
        ? [asc(fundraisingInquiries.contactName), asc(fundraisingInquiries.id)]
        : [desc(fundraisingInquiries.contactName), desc(fundraisingInquiries.id)];
    case "status":
      return isAscending
        ? [asc(fundraisingInquiries.status), desc(fundraisingInquiries.id)]
        : [desc(fundraisingInquiries.status), desc(fundraisingInquiries.id)];
    case "campaignTitle":
      return isAscending
        ? [asc(fundraisingCampaigns.title), desc(fundraisingInquiries.id)]
        : [desc(fundraisingCampaigns.title), desc(fundraisingInquiries.id)];
    default:
      return isAscending
        ? [asc(fundraisingInquiries.createdAt), asc(fundraisingInquiries.id)]
        : [desc(fundraisingInquiries.createdAt), desc(fundraisingInquiries.id)];
  }
}

function getValidContentStatusFilters(
  values: string[],
): FundraisingCampaignRow["status"][] {
  return values.flatMap((value) => {
    const parsedValue = contentStatusSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}

function getValidInquiryStatusFilters(
  values: string[],
): FundraisingInquiryStatus[] {
  return values.flatMap((value) => {
    const parsedValue = fundraisingInquiryStatusSchema.safeParse(value);
    return parsedValue.success ? [parsedValue.data] : [];
  });
}
