import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type {
  CreateScholarshipProgramInput,
  DeleteScholarshipProgramInput,
  UpdateScholarshipProgramInput,
} from "@/modules/scholarships/contracts";
import { getNextContentPublishedAt } from "@/modules/content/contracts";
import { ExpectedError } from "@/lib/action-result";
import { writeAuditLog } from "@/server/audit/log";
import { invalidateCacheKeys, PUBLIC_CACHE_KEYS } from "@/server/cache";
import { db } from "@/server/db";
import {
  scholarshipPrograms,
  storageObjects,
} from "@/server/db/schema";
import { deleteStoredObjectById } from "@/server/storage/objects";

export async function createScholarshipProgram({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: CreateScholarshipProgramInput;
}): Promise<void> {
  await ensureScholarshipSlugAvailable(input.slug);
  await ensureScholarshipAttachmentUsable(input.attachmentStorageObjectId);

  const [createdProgram] = await db
    .insert(scholarshipPrograms)
    .values({
      title: input.title,
      slug: input.slug,
      providerName: input.providerName,
      summary: input.summary,
      description: input.description,
      status: input.status,
      academicYear: input.academicYear,
      amountDescription: input.amountDescription,
      eligibility: input.eligibility,
      requirements: input.requirements,
      applicationMode: input.applicationMode,
      applicationUrl: input.applicationUrl,
      applicationInstructions: input.applicationInstructions,
      contactEmail: input.contactEmail,
      opensAt: input.opensAt ? new Date(input.opensAt) : null,
      closesAt: input.closesAt ? new Date(input.closesAt) : null,
      attachmentStorageObjectId: input.attachmentStorageObjectId,
      createdById: actorUserId,
      publishedAt: input.status === "published" ? new Date() : null,
    })
    .returning({
      id: scholarshipPrograms.id,
      title: scholarshipPrograms.title,
    });

  if (!createdProgram) {
    throw new Error("Scholarship programme could not be created.");
  }

  await writeAuditLog({
    actorUserId,
    action: "scholarship.create",
    entityType: "scholarship_program",
    entityId: createdProgram.id,
    summary: `Created scholarship programme ${createdProgram.title}.`,
    metadata: {
      applicationMode: input.applicationMode,
      providerName: input.providerName,
      status: input.status,
    },
  });

  await revalidateScholarships();
}

export async function updateScholarshipProgram({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateScholarshipProgramInput;
}): Promise<void> {
  const existingProgram = await getScholarshipProgramForMutation(
    input.scholarshipProgramId,
  );
  await ensureScholarshipSlugAvailable(input.slug, input.scholarshipProgramId);
  await ensureScholarshipAttachmentUsable(
    input.attachmentStorageObjectId,
    input.scholarshipProgramId,
  );
  const nextPublishedAt = getNextContentPublishedAt({
    currentPublishedAt: existingProgram.publishedAt,
    nextStatus: input.status,
    previousStatus: existingProgram.status,
  });

  await db
    .update(scholarshipPrograms)
    .set({
      title: input.title,
      slug: input.slug,
      providerName: input.providerName,
      summary: input.summary,
      description: input.description,
      status: input.status,
      academicYear: input.academicYear,
      amountDescription: input.amountDescription,
      eligibility: input.eligibility,
      requirements: input.requirements,
      applicationMode: input.applicationMode,
      applicationUrl: input.applicationUrl,
      applicationInstructions: input.applicationInstructions,
      contactEmail: input.contactEmail,
      opensAt: input.opensAt ? new Date(input.opensAt) : null,
      closesAt: input.closesAt ? new Date(input.closesAt) : null,
      attachmentStorageObjectId: input.attachmentStorageObjectId,
      publishedAt: nextPublishedAt,
      updatedAt: new Date(),
    })
    .where(eq(scholarshipPrograms.id, input.scholarshipProgramId));

  if (
    existingProgram.attachmentStorageObjectId &&
    existingProgram.attachmentStorageObjectId !== input.attachmentStorageObjectId
  ) {
    await deleteStoredObjectById(existingProgram.attachmentStorageObjectId);
  }

  await writeAuditLog({
    actorUserId,
    action: "scholarship.update",
    entityType: "scholarship_program",
    entityId: input.scholarshipProgramId,
    summary: `Updated scholarship programme ${input.title}.`,
    metadata: {
      previousStatus: existingProgram.status,
      nextStatus: input.status,
      previousSlug: existingProgram.slug,
      nextSlug: input.slug,
    },
  });

  await revalidateScholarships();
}

export async function deleteScholarshipProgram({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: DeleteScholarshipProgramInput;
}): Promise<void> {
  const existingProgram = await getScholarshipProgramForMutation(
    input.scholarshipProgramId,
  );

  await db
    .delete(scholarshipPrograms)
    .where(eq(scholarshipPrograms.id, input.scholarshipProgramId));

  if (existingProgram.attachmentStorageObjectId) {
    await deleteStoredObjectById(existingProgram.attachmentStorageObjectId);
  }

  await writeAuditLog({
    actorUserId,
    action: "scholarship.delete",
    entityType: "scholarship_program",
    entityId: input.scholarshipProgramId,
    summary: `Deleted scholarship programme ${existingProgram.title}.`,
    metadata: {
      providerName: existingProgram.providerName,
      slug: existingProgram.slug,
    },
  });

  await revalidateScholarships();
}

async function ensureScholarshipSlugAvailable(
  slug: string,
  ignoredProgramId?: number,
): Promise<void> {
  const [existingProgram] = await db
    .select({ id: scholarshipPrograms.id })
    .from(scholarshipPrograms)
    .where(eq(scholarshipPrograms.slug, slug))
    .limit(1);

  if (existingProgram && existingProgram.id !== ignoredProgramId) {
    throw new ExpectedError(
      "A scholarship programme with this slug already exists.",
    );
  }
}

async function ensureScholarshipAttachmentUsable(
  attachmentStorageObjectId: string | null,
  ignoredProgramId?: number,
): Promise<void> {
  if (!attachmentStorageObjectId) return;

  const [object] = await db
    .select({
      endpoint: storageObjects.endpoint,
      status: storageObjects.status,
    })
    .from(storageObjects)
    .where(eq(storageObjects.id, attachmentStorageObjectId))
    .limit(1);

  if (!object) {
    throw new ExpectedError("Uploaded scholarship attachment was not found.");
  }

  if (
    object.endpoint !== "scholarshipAttachment" ||
    object.status !== "completed"
  ) {
    throw new ExpectedError(
      "Uploaded file is not a completed scholarship attachment.",
    );
  }

  const [existingProgram] = await db
    .select({ id: scholarshipPrograms.id })
    .from(scholarshipPrograms)
    .where(
      eq(scholarshipPrograms.attachmentStorageObjectId, attachmentStorageObjectId),
    )
    .limit(1);

  if (existingProgram && existingProgram.id !== ignoredProgramId) {
    throw new ExpectedError("This scholarship attachment is already in use.");
  }
}

async function getScholarshipProgramForMutation(scholarshipProgramId: number) {
  const [program] = await db
    .select({
      id: scholarshipPrograms.id,
      title: scholarshipPrograms.title,
      slug: scholarshipPrograms.slug,
      providerName: scholarshipPrograms.providerName,
      status: scholarshipPrograms.status,
      attachmentStorageObjectId: scholarshipPrograms.attachmentStorageObjectId,
      publishedAt: scholarshipPrograms.publishedAt,
    })
    .from(scholarshipPrograms)
    .where(eq(scholarshipPrograms.id, scholarshipProgramId))
    .limit(1);

  if (!program) {
    throw new ExpectedError("Scholarship programme not found.");
  }

  return program;
}

async function revalidateScholarships(): Promise<void> {
  revalidatePath("/scholarships");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/scholarships");
  await invalidateCacheKeys([PUBLIC_CACHE_KEYS.scholarships]);
}
