import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type {
  CreateConcernInput,
  UpdateConcernInput,
} from "@/modules/concerns/contracts";
import { ExpectedError } from "@/lib/action-result";
import { writeAuditLog } from "@/server/audit/log";
import { db } from "@/server/db";
import {
  anonymousConcerns,
  storageObjects,
} from "@/server/db/schema";
import { notifyConcernSubmitted } from "@/server/notifications";

export async function createConcern({
  input,
}: {
  input: CreateConcernInput;
}): Promise<void> {
  await ensureConcernAttachmentUsable(input.attachmentStorageObjectId);

  const [createdConcern] = await db
    .insert(anonymousConcerns)
    .values({
      category: input.category,
      subject: input.subject,
      message: input.message,
      attachmentStorageObjectId: input.attachmentStorageObjectId,
    })
    .returning({
      id: anonymousConcerns.id,
      subject: anonymousConcerns.subject,
    });

  if (!createdConcern) {
    throw new Error("Concern could not be submitted.");
  }

  await writeAuditLog({
    actorUserId: null,
    action: "concern.submit",
    entityType: "anonymous_concern",
    entityId: createdConcern.id,
    summary: `Submitted anonymous concern ${createdConcern.subject}.`,
    metadata: {
      category: input.category,
      hasAttachment: input.attachmentStorageObjectId !== null,
    },
  });

  await notifyConcernSubmitted({
    subject: createdConcern.subject,
    category: input.category,
  });

  revalidateConcerns();
}

export async function updateConcern({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateConcernInput;
}): Promise<void> {
  const existingConcern = await getConcernForMutation(input.concernId);
  const reviewedAt = input.status === "new" ? null : new Date();
  const reviewedByUserId = input.status === "new" ? null : actorUserId;

  await db
    .update(anonymousConcerns)
    .set({
      status: input.status,
      internalNote: input.internalNote,
      reviewedByUserId,
      reviewedAt,
      updatedAt: new Date(),
    })
    .where(eq(anonymousConcerns.id, input.concernId));

  await writeAuditLog({
    actorUserId,
    action: "concern.update",
    entityType: "anonymous_concern",
    entityId: input.concernId,
    summary: `Updated anonymous concern ${existingConcern.subject}.`,
    metadata: {
      previousStatus: existingConcern.status,
      nextStatus: input.status,
      category: existingConcern.category,
      hasInternalNote: input.internalNote !== null,
    },
  });

  revalidateConcerns();
}

async function ensureConcernAttachmentUsable(
  attachmentStorageObjectId: string | null,
): Promise<void> {
  if (!attachmentStorageObjectId) return;

  const [object] = await db
    .select({
      id: storageObjects.id,
      endpoint: storageObjects.endpoint,
      status: storageObjects.status,
    })
    .from(storageObjects)
    .where(eq(storageObjects.id, attachmentStorageObjectId))
    .limit(1);

  if (!object) {
    throw new ExpectedError("Uploaded concern attachment was not found.");
  }

  if (object.endpoint !== "concernAttachment" || object.status !== "completed") {
    throw new ExpectedError(
      "Uploaded file is not a completed concern attachment.",
    );
  }

  const [existingConcern] = await db
    .select({ id: anonymousConcerns.id })
    .from(anonymousConcerns)
    .where(
      eq(anonymousConcerns.attachmentStorageObjectId, attachmentStorageObjectId),
    )
    .limit(1);

  if (existingConcern) {
    throw new ExpectedError("This attachment is already in use.");
  }
}

async function getConcernForMutation(concernId: number) {
  const [concern] = await db
    .select({
      id: anonymousConcerns.id,
      category: anonymousConcerns.category,
      subject: anonymousConcerns.subject,
      status: anonymousConcerns.status,
    })
    .from(anonymousConcerns)
    .where(eq(anonymousConcerns.id, concernId))
    .limit(1);

  if (!concern) {
    throw new ExpectedError("Concern not found.");
  }

  return concern;
}

function revalidateConcerns(): void {
  revalidatePath("/concerns");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/concerns");
}
