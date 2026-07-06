import "server-only";

import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "crypto";
import { eq } from "drizzle-orm";
import type {
  BulletinUnsubscribePreview,
  SubscribeToBulletinInput,
} from "@/modules/bulletin/contracts";
import { getBulletinSubscriptionById } from "@/modules/bulletin/queries";
import { ExpectedError } from "@/lib/action-result";
import { env } from "@/lib/env";
import { db } from "@/server/db";
import { bulletinSubscriptions } from "@/server/db/schema";
import { sendEmail } from "@/server/mail";
import { bulletinWelcomeTemplate } from "@/server/mail/templates/bulletin";

export type BulletinSubscriptionResult =
  | "created"
  | "reactivated"
  | "already_subscribed";

export async function subscribeToBulletin(
  input: SubscribeToBulletinInput,
): Promise<BulletinSubscriptionResult> {
  const now = new Date();
  const existingSubscription = await getSubscriptionByEmail(input.email);

  if (existingSubscription) {
    await db
      .update(bulletinSubscriptions)
      .set({
        source: input.source,
        lastSubscribedAt: now,
        unsubscribedAt: null,
        updatedAt: now,
      })
      .where(eq(bulletinSubscriptions.id, existingSubscription.id));

    if (existingSubscription.unsubscribedAt) {
      await sendWelcomeEmail(input.email);
      return "reactivated";
    }

    return "already_subscribed";
  }

  await db.insert(bulletinSubscriptions).values({
    id: randomUUID(),
    email: input.email,
    source: input.source,
    confirmedAt: now,
    lastSubscribedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await sendWelcomeEmail(input.email);
  return "created";
}

export async function getBulletinUnsubscribePreview(
  token: string,
): Promise<BulletinUnsubscribePreview | null> {
  const subscriptionId = verifyUnsubscribeToken(token);
  if (!subscriptionId) return null;

  const subscription = await getBulletinSubscriptionById(subscriptionId);
  if (!subscription) return null;

  return {
    email: subscription.email,
    status: subscription.unsubscribedAt ? "unsubscribed" : "active",
  };
}

export async function unsubscribeFromBulletin(token: string): Promise<void> {
  const subscriptionId = verifyUnsubscribeToken(token);

  if (!subscriptionId) {
    throw new ExpectedError("This unsubscribe link is invalid.");
  }

  const subscription = await getBulletinSubscriptionById(subscriptionId);

  if (!subscription) {
    throw new ExpectedError("This subscription was not found.");
  }

  if (subscription.unsubscribedAt) return;

  const now = new Date();

  await db
    .update(bulletinSubscriptions)
    .set({
      unsubscribedAt: now,
      updatedAt: now,
    })
    .where(eq(bulletinSubscriptions.id, subscriptionId));
}

export function createBulletinUnsubscribeToken(subscriptionId: string): string {
  return `${subscriptionId}.${signSubscriptionId(subscriptionId)}`;
}

async function getSubscriptionByEmail(email: string) {
  const [subscription] = await db
    .select({
      id: bulletinSubscriptions.id,
      unsubscribedAt: bulletinSubscriptions.unsubscribedAt,
    })
    .from(bulletinSubscriptions)
    .where(eq(bulletinSubscriptions.email, email))
    .limit(1);

  return subscription ?? null;
}

async function sendWelcomeEmail(email: string): Promise<void> {
  try {
    await sendEmail({
      to: email,
      subject: "You are subscribed to the MELSSA Weekly Bulletin",
      html: bulletinWelcomeTemplate(env.NEXT_PUBLIC_APP_URL),
    });
  } catch (error) {
    console.error("Bulletin welcome email failed.", { error });
  }
}

function verifyUnsubscribeToken(token: string): string | null {
  const [subscriptionId, signature] = token.split(".");

  if (!subscriptionId || !signature) return null;

  const expectedSignature = signSubscriptionId(subscriptionId);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) return null;

  return timingSafeEqual(signatureBuffer, expectedBuffer)
    ? subscriptionId
    : null;
}

function signSubscriptionId(subscriptionId: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(subscriptionId)
    .digest("base64url");
}
