import "server-only";

import { createHash, randomBytes, randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import {
  and,
  eq,
  gt,
  isNull,
} from "drizzle-orm";
import type {
  AcceptAuthInvitationInput,
  AuthInvitationPreview,
  InviteAdminUserInput,
} from "@/modules/auth/contracts";
import { normalizedEmailSchema } from "@/modules/auth/contracts";
import { getAdminInvitationStatus } from "@/modules/auth/queries";
import { ROLE_LABELS, ROLES } from "@/modules/auth/roles";
import { ExpectedError } from "@/lib/action-result";
import { env } from "@/lib/env";
import { writeAuditLog } from "@/server/audit/log";
import { db } from "@/server/db";
import {
  authInvitations,
  user,
} from "@/server/db/schema";
import { sendEmail } from "@/server/mail";
import { userInvitationTemplate } from "@/server/mail/templates/auth";

const INVITATION_TTL_DAYS = 7;

const expiresAtFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

interface AuthInvitationRecord {
  id: string;
  email: string;
  role: InviteAdminUserInput["role"];
  invitedByUserId: string | null;
  acceptedByUserId: string | null;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
  lastSentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function createAuthInvitation({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: InviteAdminUserInput;
}): Promise<void> {
  const actor = await getUserForInvitation(actorUserId);
  const existingUser = await getUserByEmail(input.email);

  if (existingUser?.role === input.role) {
    throw new ExpectedError(
      `${input.email} already has the ${ROLE_LABELS[input.role]} role.`,
    );
  }

  const now = new Date();
  const token = createInvitationToken();
  const expiresAt = getInvitationExpiry(now);
  const invitationId = randomUUID();

  await revokePendingInvitationsForEmail(input.email, now);

  await db.insert(authInvitations).values({
    id: invitationId,
    email: input.email,
    role: input.role,
    tokenHash: hashInvitationToken(token),
    invitedByUserId: actorUserId,
    expiresAt,
    lastSentAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await sendInvitationEmail({
    email: input.email,
    expiresAt,
    inviterName: actor.name,
    role: input.role,
    token,
  });

  await writeAuditLog({
    actorUserId,
    action: "auth.invitation.create",
    entityType: "auth_invitation",
    entityId: invitationId,
    summary: `Invited ${input.email} as ${ROLE_LABELS[input.role]}.`,
    metadata: {
      email: input.email,
      role: input.role,
      replacedPendingInvites: true,
    },
  });

  revalidateInvitations();
}

export async function resendAuthInvitation({
  actorUserId,
  invitationId,
}: {
  actorUserId: string;
  invitationId: string;
}): Promise<void> {
  const actor = await getUserForInvitation(actorUserId);
  const invitation = await getInvitationForMutation(invitationId);
  const status = getAdminInvitationStatus(invitation);

  if (status === "accepted") {
    throw new ExpectedError("Accepted invitations cannot be resent.");
  }

  if (status === "revoked") {
    throw new ExpectedError("Revoked invitations cannot be resent.");
  }

  const now = new Date();
  const token = createInvitationToken();
  const expiresAt = getInvitationExpiry(now);

  await db
    .update(authInvitations)
    .set({
      tokenHash: hashInvitationToken(token),
      expiresAt,
      lastSentAt: now,
      updatedAt: now,
    })
    .where(eq(authInvitations.id, invitationId));

  await sendInvitationEmail({
    email: invitation.email,
    expiresAt,
    inviterName: actor.name,
    role: invitation.role,
    token,
  });

  await writeAuditLog({
    actorUserId,
    action: "auth.invitation.resend",
    entityType: "auth_invitation",
    entityId: invitationId,
    summary: `Resent invite to ${invitation.email}.`,
    metadata: {
      email: invitation.email,
      role: invitation.role,
    },
  });

  revalidateInvitations();
}

export async function revokeAuthInvitation({
  actorUserId,
  invitationId,
}: {
  actorUserId: string;
  invitationId: string;
}): Promise<void> {
  const invitation = await getInvitationForMutation(invitationId);
  const status = getAdminInvitationStatus(invitation);

  if (status === "accepted") {
    throw new ExpectedError("Accepted invitations cannot be revoked.");
  }

  if (status === "revoked") return;

  const now = new Date();

  await db
    .update(authInvitations)
    .set({
      revokedAt: now,
      updatedAt: now,
    })
    .where(eq(authInvitations.id, invitationId));

  await writeAuditLog({
    actorUserId,
    action: "auth.invitation.revoke",
    entityType: "auth_invitation",
    entityId: invitationId,
    summary: `Revoked invite to ${invitation.email}.`,
    metadata: {
      email: invitation.email,
      role: invitation.role,
    },
  });

  revalidateInvitations();
}

export async function acceptAuthInvitation({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: AcceptAuthInvitationInput;
}): Promise<void> {
  const invitation = await getInvitationByToken(input.token);

  if (!invitation) {
    throw new ExpectedError("This invitation link is invalid.");
  }

  const status = getAdminInvitationStatus(invitation);

  if (status !== "pending") {
    throw new ExpectedError(getInvitationStatusMessage(status));
  }

  const targetUser = await getUserForInvitation(actorUserId);
  const targetEmail = normalizeEmail(targetUser.email);

  if (targetEmail !== invitation.email) {
    throw new ExpectedError(
      `Sign in with ${invitation.email} to accept this invitation.`,
    );
  }

  const now = new Date();

  await db
    .update(user)
    .set({
      role: invitation.role,
      updatedAt: now,
    })
    .where(eq(user.id, actorUserId));

  await db
    .update(authInvitations)
    .set({
      acceptedAt: now,
      acceptedByUserId: actorUserId,
      updatedAt: now,
    })
    .where(eq(authInvitations.id, invitation.id));

  await writeAuditLog({
    actorUserId,
    action: "auth.invitation.accept",
    entityType: "auth_invitation",
    entityId: invitation.id,
    summary: `${targetUser.email} accepted an invite as ${ROLE_LABELS[invitation.role]}.`,
    metadata: {
      email: invitation.email,
      role: invitation.role,
    },
  });

  revalidateInvitations();
}

export async function getAuthInvitationPreviewByToken(
  token: string,
): Promise<AuthInvitationPreview | null> {
  const invitation = await getInvitationByToken(token);

  if (!invitation) return null;

  return {
    email: invitation.email,
    role: invitation.role,
    status: getAdminInvitationStatus(invitation),
    expiresAt: invitation.expiresAt.toISOString(),
  };
}

export async function hasPendingAuthInvitationForEmail(
  email: string,
): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) return false;

  const [invitation] = await db
    .select({ id: authInvitations.id })
    .from(authInvitations)
    .where(
      and(
        eq(authInvitations.email, normalizedEmail),
        isNull(authInvitations.acceptedAt),
        isNull(authInvitations.revokedAt),
        gt(authInvitations.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return invitation !== undefined;
}

async function getInvitationByToken(
  token: string,
): Promise<AuthInvitationRecord | null> {
  const [invitation] = await db
    .select({
      id: authInvitations.id,
      email: authInvitations.email,
      role: authInvitations.role,
      invitedByUserId: authInvitations.invitedByUserId,
      acceptedByUserId: authInvitations.acceptedByUserId,
      acceptedAt: authInvitations.acceptedAt,
      revokedAt: authInvitations.revokedAt,
      expiresAt: authInvitations.expiresAt,
      lastSentAt: authInvitations.lastSentAt,
      createdAt: authInvitations.createdAt,
      updatedAt: authInvitations.updatedAt,
    })
    .from(authInvitations)
    .where(eq(authInvitations.tokenHash, hashInvitationToken(token)))
    .limit(1);

  return invitation ?? null;
}

async function getInvitationForMutation(
  invitationId: string,
): Promise<AuthInvitationRecord> {
  const [invitation] = await db
    .select({
      id: authInvitations.id,
      email: authInvitations.email,
      role: authInvitations.role,
      invitedByUserId: authInvitations.invitedByUserId,
      acceptedByUserId: authInvitations.acceptedByUserId,
      acceptedAt: authInvitations.acceptedAt,
      revokedAt: authInvitations.revokedAt,
      expiresAt: authInvitations.expiresAt,
      lastSentAt: authInvitations.lastSentAt,
      createdAt: authInvitations.createdAt,
      updatedAt: authInvitations.updatedAt,
    })
    .from(authInvitations)
    .where(eq(authInvitations.id, invitationId))
    .limit(1);

  if (!invitation) {
    throw new ExpectedError("Invitation not found.");
  }

  return invitation;
}

async function getUserForInvitation(userId: string) {
  const [foundUser] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!foundUser) {
    throw new ExpectedError("User not found.");
  }

  return {
    ...foundUser,
    role: foundUser.role ?? ROLES.STUDENT,
  };
}

async function getUserByEmail(email: string) {
  const [foundUser] = await db
    .select({
      id: user.id,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!foundUser) return null;

  return {
    ...foundUser,
    role: foundUser.role ?? ROLES.STUDENT,
  };
}

async function revokePendingInvitationsForEmail(
  email: string,
  revokedAt: Date,
): Promise<void> {
  await db
    .update(authInvitations)
    .set({
      revokedAt,
      updatedAt: revokedAt,
    })
    .where(
      and(
        eq(authInvitations.email, email),
        isNull(authInvitations.acceptedAt),
        isNull(authInvitations.revokedAt),
      ),
    );
}

async function sendInvitationEmail({
  email,
  expiresAt,
  inviterName,
  role,
  token,
}: {
  email: string;
  expiresAt: Date;
  inviterName: string;
  role: InviteAdminUserInput["role"];
  token: string;
}): Promise<void> {
  const inviteUrl = new URL("/accept-invite", env.NEXT_PUBLIC_APP_URL);
  inviteUrl.searchParams.set("token", token);

  await sendEmail({
    to: email,
    subject: "You have a MELSSA workspace invitation",
    html: userInvitationTemplate({
      expiresAtLabel: expiresAtFormatter.format(expiresAt),
      inviteUrl: inviteUrl.toString(),
      inviterName,
      roleLabel: ROLE_LABELS[role],
    }),
  });
}

function createInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getInvitationExpiry(now: Date): Date {
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + INVITATION_TTL_DAYS);
  return expiresAt;
}

function normalizeEmail(email: string): string | null {
  const parsedEmail = normalizedEmailSchema.safeParse(email);
  return parsedEmail.success ? parsedEmail.data : null;
}

function getInvitationStatusMessage(
  status: Exclude<ReturnType<typeof getAdminInvitationStatus>, "pending">,
): string {
  if (status === "accepted") return "This invitation has already been accepted.";
  if (status === "revoked") return "This invitation has been revoked.";
  return "This invitation has expired. Ask an admin to resend it.";
}

function revalidateInvitations(): void {
  revalidatePath("/accept-invite");
  revalidatePath("/dashboard/users");
}
