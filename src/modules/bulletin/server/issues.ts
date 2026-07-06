import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import sanitizeHtml from "sanitize-html";
import {
  createBulletinIssueInputSchema,
  type ArchiveBulletinIssueInput,
  type BulletinIssueRow,
  type CreateBulletinIssueInput,
  type SendBulletinIssueInput,
  type UpdateBulletinIssueInput,
} from "@/modules/bulletin/contracts";
import { CONTENT_ADMIN_ROLES } from "@/modules/auth/roles";
import {
  getActiveBulletinIssueById,
  getActiveBulletinSubscriptions,
  serializeBulletinIssue,
} from "@/modules/bulletin/queries";
import { createBulletinUnsubscribeToken } from "@/modules/bulletin/server/subscriptions";
import { createDashboardNotificationsForRoles } from "@/modules/notifications/server/notifications";
import { ExpectedError } from "@/lib/action-result";
import { env } from "@/lib/env";
import { writeAuditLog } from "@/server/audit/log";
import { db } from "@/server/db";
import {
  bulletinDeliveries,
  bulletinIssues,
} from "@/server/db/schema";
import { sendEmail } from "@/server/mail";
import { bulletinIssueTemplate } from "@/server/mail/templates/bulletin";

interface SendBulletinResult {
  recipientCount: number;
  successCount: number;
  failureCount: number;
}

export async function createBulletinIssue({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: CreateBulletinIssueInput;
}): Promise<void> {
  const now = new Date();
  const sanitizedInput = sanitizeBulletinIssueInput(input);

  const [createdIssue] = await db
    .insert(bulletinIssues)
    .values({
      title: sanitizedInput.title,
      subject: sanitizedInput.subject,
      previewText: sanitizedInput.previewText,
      editorNote: sanitizedInput.editorNote,
      sections: sanitizedInput.sections,
      audienceTags: sanitizedInput.audienceTags,
      createdById: actorUserId,
      updatedById: actorUserId,
      createdAt: now,
      updatedAt: now,
    })
    .returning({
      id: bulletinIssues.id,
      title: bulletinIssues.title,
    });

  if (!createdIssue) {
    throw new Error("Bulletin issue could not be created.");
  }

  await writeAuditLog({
    actorUserId,
    action: "bulletin.create",
    entityType: "bulletin_issue",
    entityId: createdIssue.id,
    summary: `Created bulletin ${createdIssue.title}.`,
    metadata: {
      title: createdIssue.title,
      sectionCount: sanitizedInput.sections.length,
    },
  });

  revalidateBulletins();
}

export async function updateBulletinIssue({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateBulletinIssueInput;
}): Promise<void> {
  const existingIssue = await getBulletinForMutation(input.bulletinId);

  if (existingIssue.status !== "draft") {
    throw new ExpectedError(
      `${existingIssue.status === "sent" ? "Sent" : "Archived"} bulletins cannot be edited.`,
    );
  }

  const now = new Date();
  const sanitizedInput = sanitizeBulletinIssueInput(input);

  await db
    .update(bulletinIssues)
    .set({
      title: sanitizedInput.title,
      subject: sanitizedInput.subject,
      previewText: sanitizedInput.previewText,
      editorNote: sanitizedInput.editorNote,
      sections: sanitizedInput.sections,
      audienceTags: sanitizedInput.audienceTags,
      updatedById: actorUserId,
      updatedAt: now,
    })
    .where(eq(bulletinIssues.id, input.bulletinId));

  await writeAuditLog({
    actorUserId,
    action: "bulletin.update",
    entityType: "bulletin_issue",
    entityId: input.bulletinId,
    summary: `Updated bulletin ${sanitizedInput.title}.`,
    metadata: {
      previousTitle: existingIssue.title,
      nextTitle: sanitizedInput.title,
      sectionCount: sanitizedInput.sections.length,
    },
  });

  revalidateBulletins();
}

export async function archiveBulletinIssue({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: ArchiveBulletinIssueInput;
}): Promise<void> {
  const existingIssue = await getBulletinForMutation(input.bulletinId);

  if (existingIssue.status === "archived") return;

  const now = new Date();

  await db
    .update(bulletinIssues)
    .set({
      status: "archived",
      archivedAt: now,
      updatedById: actorUserId,
      updatedAt: now,
    })
    .where(eq(bulletinIssues.id, input.bulletinId));

  await writeAuditLog({
    actorUserId,
    action: "bulletin.archive",
    entityType: "bulletin_issue",
    entityId: input.bulletinId,
    summary: `Archived bulletin ${existingIssue.title}.`,
    metadata: {
      previousStatus: existingIssue.status,
      nextStatus: "archived",
    },
  });

  revalidateBulletins();
}

export async function sendBulletinIssue({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: SendBulletinIssueInput;
}): Promise<SendBulletinResult> {
  const issue = await getBulletinForMutation(input.bulletinId);

  if (issue.status === "sent") {
    throw new ExpectedError("This bulletin has already been sent.");
  }

  if (issue.status === "archived") {
    throw new ExpectedError("Archived bulletins cannot be sent.");
  }

  const completeness = createBulletinIssueInputSchema.safeParse({
    title: issue.title,
    subject: issue.subject,
    previewText: issue.previewText,
    editorNote: issue.editorNote,
    sections: issue.sections,
    audienceTags: issue.audienceTags,
  });

  if (!completeness.success) {
    throw new ExpectedError("Complete the bulletin before sending it.");
  }

  const subscriptions = await getActiveBulletinSubscriptions();

  if (subscriptions.length === 0) {
    throw new ExpectedError("There are no active bulletin subscribers.");
  }

  let successCount = 0;
  let failureCount = 0;
  let lastDeliveryError: string | null = null;

  for (const subscription of subscriptions) {
    const unsubscribeUrl = getUnsubscribeUrl(subscription.id);

    try {
      const result = await sendEmail({
        to: subscription.email,
        subject: issue.subject,
        html: bulletinIssueTemplate({
          title: issue.title,
          previewText: issue.previewText,
          editorNote: issue.editorNote,
          sections: issue.sections,
          portalUrl: env.NEXT_PUBLIC_APP_URL,
          unsubscribeUrl,
        }),
      });

      successCount += 1;

      await db.insert(bulletinDeliveries).values({
        issueId: issue.id,
        subscriptionId: subscription.id,
        email: subscription.email,
        status: "sent",
        provider: result.provider,
        messageId: result.messageId,
        sentAt: new Date(),
      });
    } catch (error) {
      failureCount += 1;
      lastDeliveryError = getDeliveryErrorMessage(error);

      await db.insert(bulletinDeliveries).values({
        issueId: issue.id,
        subscriptionId: subscription.id,
        email: subscription.email,
        status: "failed",
        errorMessage: lastDeliveryError,
      });
    }
  }

  const now = new Date();

  await db
    .update(bulletinIssues)
    .set({
      status: "sent",
      sentAt: now,
      sentById: actorUserId,
      recipientCount: subscriptions.length,
      deliverySuccessCount: successCount,
      deliveryFailureCount: failureCount,
      lastDeliveryError,
      updatedById: actorUserId,
      updatedAt: now,
    })
    .where(eq(bulletinIssues.id, issue.id));

  await writeAuditLog({
    actorUserId,
    action: "bulletin.send",
    entityType: "bulletin_issue",
    entityId: issue.id,
    summary: `Sent bulletin ${issue.title} to ${successCount} of ${subscriptions.length} subscribers.`,
    metadata: {
      title: issue.title,
      recipientCount: subscriptions.length,
      successCount,
      failureCount,
    },
  });

  await notifyContentAdminsOfBulletinSend({
    failureCount,
    issueTitle: issue.title,
    recipientCount: subscriptions.length,
    successCount,
  });

  revalidateBulletins();

  return {
    recipientCount: subscriptions.length,
    successCount,
    failureCount,
  };
}

export async function getBulletinIssueForEmailPreview(
  bulletinId: number,
): Promise<BulletinIssueRow> {
  const issue = await getBulletinForMutation(bulletinId);
  return serializeBulletinIssue(issue);
}

async function getBulletinForMutation(bulletinId: number) {
  const issue = await getActiveBulletinIssueById(bulletinId);

  if (!issue) {
    throw new ExpectedError("Bulletin not found.");
  }

  return issue;
}

function getUnsubscribeUrl(subscriptionId: string): string {
  const url = new URL("/bulletin/unsubscribe", env.NEXT_PUBLIC_APP_URL);
  url.searchParams.set("token", createBulletinUnsubscribeToken(subscriptionId));
  return url.toString();
}

function getDeliveryErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message.slice(0, 500);
  }

  return "Delivery failed.";
}

async function notifyContentAdminsOfBulletinSend({
  failureCount,
  issueTitle,
  recipientCount,
  successCount,
}: {
  failureCount: number;
  issueTitle: string;
  recipientCount: number;
  successCount: number;
}): Promise<void> {
  try {
    await createDashboardNotificationsForRoles({
      body:
        failureCount > 0
          ? `${issueTitle} reached ${successCount} of ${recipientCount} subscribers.`
          : `${issueTitle} was sent to ${successCount} subscribers.`,
      href: "/dashboard/bulletins",
      roles: CONTENT_ADMIN_ROLES,
      title:
        failureCount > 0
          ? "Bulletin sent with delivery issues"
          : "Bulletin sent",
      type:
        failureCount > 0
          ? "bulletin.delivery.partial"
          : "bulletin.delivery.sent",
    });
  } catch (error) {
    console.error("Bulletin dashboard notification failed.", { error });
  }
}

function sanitizeBulletinIssueInput<TInput extends CreateBulletinIssueInput>(
  input: TInput,
): TInput {
  return {
    ...input,
    editorNote: sanitizeBulletinRichText(input.editorNote),
    sections: input.sections.map((section) => ({
      ...section,
      body: sanitizeBulletinRichText(section.body),
    })),
  };
}

function sanitizeBulletinRichText(value: string): string {
  return sanitizeHtml(value, {
    allowedAttributes: {
      a: ["href", "rel", "target"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedTags: [
      "a",
      "blockquote",
      "br",
      "em",
      "li",
      "ol",
      "p",
      "strong",
      "ul",
    ],
    disallowedTagsMode: "discard",
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noreferrer",
        target: "_blank",
      }),
    },
  }).trim();
}

function revalidateBulletins(): void {
  revalidatePath("/dashboard/bulletins");
}
