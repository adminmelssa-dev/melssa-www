import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type {
  UpdateAdminUserAccessInput,
  UpdateAdminUserRoleInput,
  UpdateAdminUserVerificationInput,
} from "@/modules/auth/contracts";
import { ROLE_LABELS, ROLES } from "@/modules/auth/roles";
import { ExpectedError } from "@/lib/action-result";
import { writeAuditLog } from "@/server/audit/log";
import { db } from "@/server/db";
import { session, user } from "@/server/db/schema";

export async function setAdminUserRole({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateAdminUserRoleInput;
}): Promise<void> {
  if (actorUserId === input.userId && input.role !== ROLES.SITE_ADMIN) {
    throw new ExpectedError("You cannot remove your own site admin role.");
  }

  const targetUser = await getUserForMutation(input.userId);
  if (targetUser.role === input.role) return;

  await db
    .update(user)
    .set({
      role: input.role,
      updatedAt: new Date(),
    })
    .where(eq(user.id, input.userId));

  await writeAuditLog({
    actorUserId,
    action: "user.role.update",
    entityType: "user",
    entityId: input.userId,
    summary: `Changed ${targetUser.email} role to ${ROLE_LABELS[input.role]}.`,
    metadata: {
      previousRole: targetUser.role,
      nextRole: input.role,
      targetEmail: targetUser.email,
    },
  });

  revalidateUsers();
}

export async function setAdminUserAccess({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateAdminUserAccessInput;
}): Promise<void> {
  if (actorUserId === input.userId && input.intent === "ban") {
    throw new ExpectedError("You cannot restrict your own account.");
  }

  const targetUser = await getUserForMutation(input.userId);
  const nextBanned = input.intent === "ban";
  const reason = nextBanned
    ? input.banReason || "Administrative access restriction"
    : null;

  if ((targetUser.banned ?? false) === nextBanned) return;

  await db
    .update(user)
    .set({
      banned: nextBanned,
      banReason: reason,
      banExpires: null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, input.userId));

  if (nextBanned) {
    await db.delete(session).where(eq(session.userId, input.userId));
  }

  await writeAuditLog({
    actorUserId,
    action: nextBanned ? "user.access.restrict" : "user.access.restore",
    entityType: "user",
    entityId: input.userId,
    summary: `${nextBanned ? "Restricted" : "Restored"} access for ${targetUser.email}.`,
    metadata: {
      targetEmail: targetUser.email,
      reason,
    },
  });

  revalidateUsers();
}

export async function setAdminUserVerification({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateAdminUserVerificationInput;
}): Promise<void> {
  const targetUser = await getUserForMutation(input.userId);
  const nextVerified = input.intent === "verify";

  if (targetUser.emailVerified === nextVerified) return;

  await db
    .update(user)
    .set({
      emailVerified: nextVerified,
      updatedAt: new Date(),
    })
    .where(eq(user.id, input.userId));

  await writeAuditLog({
    actorUserId,
    action: nextVerified ? "user.email.verify" : "user.email.unverify",
    entityType: "user",
    entityId: input.userId,
    summary: `${nextVerified ? "Verified" : "Marked unverified"} ${targetUser.email}.`,
    metadata: {
      targetEmail: targetUser.email,
    },
  });

  revalidateUsers();
}

async function getUserForMutation(userId: string) {
  const [targetUser] = await db
    .select({
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      banned: user.banned,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!targetUser) {
    throw new ExpectedError("User not found.");
  }

  return targetUser;
}

function revalidateUsers(): void {
  revalidatePath("/dashboard/users");
}
