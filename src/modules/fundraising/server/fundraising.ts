import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type {
  CreateFundraisingCampaignInput,
  CreateFundraisingInquiryInput,
  DeleteFundraisingCampaignInput,
  UpdateFundraisingCampaignInput,
  UpdateFundraisingInquiryInput,
} from "@/modules/fundraising/contracts";
import { getNextContentPublishedAt } from "@/modules/content/contracts";
import { ExpectedError } from "@/lib/action-result";
import { writeAuditLog } from "@/server/audit/log";
import { invalidateCacheKeys, PUBLIC_CACHE_KEYS } from "@/server/cache";
import { db } from "@/server/db";
import {
  fundraisingCampaigns,
  fundraisingInquiries,
  storageObjects,
} from "@/server/db/schema";
import { deleteStoredObjectById } from "@/server/storage/objects";

export async function createFundraisingCampaign({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: CreateFundraisingCampaignInput;
}): Promise<void> {
  await ensureCampaignSlugAvailable(input.slug);
  await ensureCampaignCoverUsable(input.coverStorageObjectId);

  const [createdCampaign] = await db
    .insert(fundraisingCampaigns)
    .values({
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      body: input.body,
      status: input.status,
      goalAmountMinor: input.goalAmountMinor,
      currency: input.currency,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      paymentInstructions: input.paymentInstructions,
      paymentMethods: input.paymentMethods,
      sponsorshipTiers: input.sponsorshipTiers,
      coverStorageObjectId: input.coverStorageObjectId,
      createdById: actorUserId,
      publishedAt: input.status === "published" ? new Date() : null,
    })
    .returning({
      id: fundraisingCampaigns.id,
      title: fundraisingCampaigns.title,
    });

  if (!createdCampaign) {
    throw new Error("Fundraising campaign could not be created.");
  }

  await writeAuditLog({
    actorUserId,
    action: "fundraising.create",
    entityType: "fundraising_campaign",
    entityId: createdCampaign.id,
    summary: `Created fundraising campaign ${createdCampaign.title}.`,
    metadata: {
      status: input.status,
      slug: input.slug,
      tierCount: input.sponsorshipTiers.length,
    },
  });

  await revalidateFundraising();
}

export async function updateFundraisingCampaign({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateFundraisingCampaignInput;
}): Promise<void> {
  const existingCampaign = await getCampaignForMutation(input.campaignId);
  await ensureCampaignSlugAvailable(input.slug, input.campaignId);
  await ensureCampaignCoverUsable(input.coverStorageObjectId, input.campaignId);
  const nextPublishedAt = getNextContentPublishedAt({
    currentPublishedAt: existingCampaign.publishedAt,
    nextStatus: input.status,
    previousStatus: existingCampaign.status,
  });

  await db
    .update(fundraisingCampaigns)
    .set({
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      body: input.body,
      status: input.status,
      goalAmountMinor: input.goalAmountMinor,
      currency: input.currency,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      paymentInstructions: input.paymentInstructions,
      paymentMethods: input.paymentMethods,
      sponsorshipTiers: input.sponsorshipTiers,
      coverStorageObjectId: input.coverStorageObjectId,
      publishedAt: nextPublishedAt,
      updatedAt: new Date(),
    })
    .where(eq(fundraisingCampaigns.id, input.campaignId));

  if (
    existingCampaign.coverStorageObjectId &&
    existingCampaign.coverStorageObjectId !== input.coverStorageObjectId
  ) {
    await deleteStoredObjectById(existingCampaign.coverStorageObjectId);
  }

  await writeAuditLog({
    actorUserId,
    action: "fundraising.update",
    entityType: "fundraising_campaign",
    entityId: input.campaignId,
    summary: `Updated fundraising campaign ${input.title}.`,
    metadata: {
      previousStatus: existingCampaign.status,
      nextStatus: input.status,
      previousSlug: existingCampaign.slug,
      nextSlug: input.slug,
    },
  });

  await revalidateFundraising();
}

export async function deleteFundraisingCampaign({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: DeleteFundraisingCampaignInput;
}): Promise<void> {
  const existingCampaign = await getCampaignForMutation(input.campaignId);

  await db
    .delete(fundraisingCampaigns)
    .where(eq(fundraisingCampaigns.id, input.campaignId));

  if (existingCampaign.coverStorageObjectId) {
    await deleteStoredObjectById(existingCampaign.coverStorageObjectId);
  }

  await writeAuditLog({
    actorUserId,
    action: "fundraising.delete",
    entityType: "fundraising_campaign",
    entityId: input.campaignId,
    summary: `Deleted fundraising campaign ${existingCampaign.title}.`,
    metadata: {
      slug: existingCampaign.slug,
      status: existingCampaign.status,
    },
  });

  await revalidateFundraising();
}

export async function createFundraisingInquiry(
  input: CreateFundraisingInquiryInput,
): Promise<void> {
  if (input.campaignId !== null) {
    await ensurePublishedCampaignExists(input.campaignId);
  }

  const [createdInquiry] = await db
    .insert(fundraisingInquiries)
    .values({
      campaignId: input.campaignId,
      organizationName: input.organizationName,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      phone: input.phone,
      message: input.message,
    })
    .returning({
      id: fundraisingInquiries.id,
      contactEmail: fundraisingInquiries.contactEmail,
    });

  if (!createdInquiry) {
    throw new Error("Fundraising inquiry could not be created.");
  }

  await writeAuditLog({
    actorUserId: null,
    action: "fundraising.inquiry.create",
    entityType: "fundraising_inquiry",
    entityId: createdInquiry.id,
    summary: `Received fundraising inquiry from ${createdInquiry.contactEmail}.`,
    metadata: {
      campaignId: input.campaignId,
      hasOrganization: input.organizationName !== null,
    },
  });

  revalidatePath("/dashboard/fundraising");
}

export async function updateFundraisingInquiry({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateFundraisingInquiryInput;
}): Promise<void> {
  const existingInquiry = await getInquiryForMutation(input.inquiryId);
  const reviewedAt =
    input.status === "new" ? null : existingInquiry.reviewedAt ?? new Date();

  await db
    .update(fundraisingInquiries)
    .set({
      status: input.status,
      internalNotes: input.internalNotes,
      reviewedByUserId: actorUserId,
      reviewedAt,
      updatedAt: new Date(),
    })
    .where(eq(fundraisingInquiries.id, input.inquiryId));

  await writeAuditLog({
    actorUserId,
    action: "fundraising.inquiry.update",
    entityType: "fundraising_inquiry",
    entityId: input.inquiryId,
    summary: `Updated fundraising inquiry from ${existingInquiry.contactEmail}.`,
    metadata: {
      previousStatus: existingInquiry.status,
      nextStatus: input.status,
    },
  });

  revalidatePath("/dashboard/fundraising");
}

async function ensureCampaignSlugAvailable(
  slug: string,
  ignoredCampaignId?: number,
): Promise<void> {
  const [existingCampaign] = await db
    .select({ id: fundraisingCampaigns.id })
    .from(fundraisingCampaigns)
    .where(eq(fundraisingCampaigns.slug, slug))
    .limit(1);

  if (existingCampaign && existingCampaign.id !== ignoredCampaignId) {
    throw new ExpectedError("A fundraising campaign with this slug already exists.");
  }
}

async function ensureCampaignCoverUsable(
  coverStorageObjectId: string | null,
  ignoredCampaignId?: number,
): Promise<void> {
  if (!coverStorageObjectId) return;

  const [object] = await db
    .select({
      endpoint: storageObjects.endpoint,
      status: storageObjects.status,
    })
    .from(storageObjects)
    .where(eq(storageObjects.id, coverStorageObjectId))
    .limit(1);

  if (!object) {
    throw new ExpectedError("Uploaded fundraising cover image was not found.");
  }

  if (
    object.endpoint !== "fundraisingCoverImage" ||
    object.status !== "completed"
  ) {
    throw new ExpectedError("Uploaded file is not a completed cover image.");
  }

  const [existingCampaign] = await db
    .select({ id: fundraisingCampaigns.id })
    .from(fundraisingCampaigns)
    .where(eq(fundraisingCampaigns.coverStorageObjectId, coverStorageObjectId))
    .limit(1);

  if (existingCampaign && existingCampaign.id !== ignoredCampaignId) {
    throw new ExpectedError("This cover image is already in use.");
  }
}

async function ensurePublishedCampaignExists(campaignId: number): Promise<void> {
  const [campaign] = await db
    .select({
      id: fundraisingCampaigns.id,
      status: fundraisingCampaigns.status,
    })
    .from(fundraisingCampaigns)
    .where(eq(fundraisingCampaigns.id, campaignId))
    .limit(1);

  if (!campaign || campaign.status !== "published") {
    throw new ExpectedError("Selected fundraising campaign was not found.");
  }
}

async function getCampaignForMutation(campaignId: number) {
  const [campaign] = await db
    .select({
      id: fundraisingCampaigns.id,
      title: fundraisingCampaigns.title,
      slug: fundraisingCampaigns.slug,
      status: fundraisingCampaigns.status,
      coverStorageObjectId: fundraisingCampaigns.coverStorageObjectId,
      publishedAt: fundraisingCampaigns.publishedAt,
    })
    .from(fundraisingCampaigns)
    .where(eq(fundraisingCampaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    throw new ExpectedError("Fundraising campaign not found.");
  }

  return campaign;
}

async function getInquiryForMutation(inquiryId: number) {
  const [inquiry] = await db
    .select({
      id: fundraisingInquiries.id,
      contactEmail: fundraisingInquiries.contactEmail,
      status: fundraisingInquiries.status,
      reviewedAt: fundraisingInquiries.reviewedAt,
    })
    .from(fundraisingInquiries)
    .where(eq(fundraisingInquiries.id, inquiryId))
    .limit(1);

  if (!inquiry) {
    throw new ExpectedError("Fundraising inquiry not found.");
  }

  return inquiry;
}

async function revalidateFundraising(): Promise<void> {
  revalidatePath("/fundraising");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/fundraising");
  await invalidateCacheKeys([PUBLIC_CACHE_KEYS.fundraising]);
}
