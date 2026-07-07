import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type {
  CreateFinanceDocumentInput,
  DeleteFinanceDocumentInput,
  UpdateFinanceDocumentInput,
} from "@/modules/finance/contracts";
import { FINANCE_DOCUMENT_TYPE_LABELS } from "@/modules/finance/contracts";
import { getNextContentPublishedAt } from "@/modules/content/contracts";
import { ExpectedError } from "@/lib/action-result";
import { writeAuditLog } from "@/server/audit/log";
import { invalidateCacheKeys, PUBLIC_CACHE_KEYS } from "@/server/cache";
import { db } from "@/server/db";
import {
  financeDocuments,
  storageObjects,
} from "@/server/db/schema";
import { deleteStoredObjectById } from "@/server/storage/objects";

export async function createFinanceDocument({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: CreateFinanceDocumentInput;
}): Promise<void> {
  await ensureFinanceDocumentFileUsable(input.storageObjectId);

  const [createdDocument] = await db
    .insert(financeDocuments)
    .values({
      title: input.title,
      summary: input.summary,
      type: input.type,
      status: input.status,
      academicYear: input.academicYear,
      semester: input.semester,
      programmeName: input.programmeName,
      datePresented: input.datePresented ? new Date(input.datePresented) : null,
      storageObjectId: input.storageObjectId,
      createdById: actorUserId,
      publishedAt: input.status === "published" ? new Date() : null,
    })
    .returning({
      id: financeDocuments.id,
      title: financeDocuments.title,
    });

  if (!createdDocument) {
    throw new Error("Finance document could not be created.");
  }

  await writeAuditLog({
    actorUserId,
    action: "finance.create",
    entityType: "finance_document",
    entityId: createdDocument.id,
    summary: `Created finance document ${createdDocument.title}.`,
    metadata: {
      academicYear: input.academicYear,
      status: input.status,
      type: input.type,
    },
  });

  await revalidateFinanceDocuments();
}

export async function updateFinanceDocument({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateFinanceDocumentInput;
}): Promise<void> {
  const existingDocument = await getFinanceDocumentForMutation(
    input.financeDocumentId,
  );
  const nextPublishedAt = getNextContentPublishedAt({
    currentPublishedAt: existingDocument.publishedAt,
    nextStatus: input.status,
    previousStatus: existingDocument.status,
  });

  await db
    .update(financeDocuments)
    .set({
      title: input.title,
      summary: input.summary,
      type: input.type,
      status: input.status,
      academicYear: input.academicYear,
      semester: input.semester,
      programmeName: input.programmeName,
      datePresented: input.datePresented ? new Date(input.datePresented) : null,
      publishedAt: nextPublishedAt,
      updatedAt: new Date(),
    })
    .where(eq(financeDocuments.id, input.financeDocumentId));

  await writeAuditLog({
    actorUserId,
    action: "finance.update",
    entityType: "finance_document",
    entityId: input.financeDocumentId,
    summary: `Updated finance document ${input.title}.`,
    metadata: {
      previousStatus: existingDocument.status,
      nextStatus: input.status,
      previousType: existingDocument.type,
      nextType: input.type,
    },
  });

  await revalidateFinanceDocuments();
}

export async function deleteFinanceDocument({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: DeleteFinanceDocumentInput;
}): Promise<void> {
  const existingDocument = await getFinanceDocumentForMutation(
    input.financeDocumentId,
  );

  await db
    .delete(financeDocuments)
    .where(eq(financeDocuments.id, input.financeDocumentId));
  if (existingDocument.storageObjectId) {
    await deleteStoredObjectById(existingDocument.storageObjectId);
  }

  await writeAuditLog({
    actorUserId,
    action: "finance.delete",
    entityType: "finance_document",
    entityId: input.financeDocumentId,
    summary: `Deleted finance document ${existingDocument.title}.`,
    metadata: {
      title: existingDocument.title,
      type: existingDocument.type,
    },
  });

  await revalidateFinanceDocuments();
}

async function ensureFinanceDocumentFileUsable(
  storageObjectId: string,
): Promise<void> {
  const [object] = await db
    .select({
      endpoint: storageObjects.endpoint,
      status: storageObjects.status,
    })
    .from(storageObjects)
    .where(eq(storageObjects.id, storageObjectId))
    .limit(1);

  if (!object) {
    throw new ExpectedError("Uploaded finance document was not found.");
  }

  if (object.endpoint !== "financeDocument" || object.status !== "completed") {
    throw new ExpectedError("Uploaded file is not a completed finance document.");
  }

  const [existingDocument] = await db
    .select({ id: financeDocuments.id })
    .from(financeDocuments)
    .where(eq(financeDocuments.storageObjectId, storageObjectId))
    .limit(1);

  if (existingDocument) {
    throw new ExpectedError("This finance document is already attached.");
  }
}

async function getFinanceDocumentForMutation(financeDocumentId: number) {
  const [document] = await db
    .select({
      id: financeDocuments.id,
      title: financeDocuments.title,
      type: financeDocuments.type,
      status: financeDocuments.status,
      storageObjectId: financeDocuments.storageObjectId,
      publishedAt: financeDocuments.publishedAt,
    })
    .from(financeDocuments)
    .where(eq(financeDocuments.id, financeDocumentId))
    .limit(1);

  if (!document) {
    throw new ExpectedError("Finance document not found.");
  }

  return document;
}

async function revalidateFinanceDocuments(): Promise<void> {
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/finance");
  await invalidateCacheKeys([PUBLIC_CACHE_KEYS.finance]);
}

export function getFinanceDocumentTypeLabel(
  type: CreateFinanceDocumentInput["type"],
): string {
  return FINANCE_DOCUMENT_TYPE_LABELS[type];
}
