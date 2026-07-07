import "server-only";

import { revalidatePath } from "next/cache";
import {
  and,
  eq,
} from "drizzle-orm";
import type {
  UpdateAdminUserPermissionGrantInput,
  UpdateAdminUserAccessInput,
  UpdateAdminUserRoleInput,
  UpdateAdminUserVerificationInput,
} from "@/modules/auth/contracts";
import { ROLE_LABELS, ROLES } from "@/modules/auth/roles";
import {
  createPermissionKey,
  getAllPermissionDefinitions,
} from "@/modules/auth/permissions";
import { getPermissionChecker } from "@/server/auth/guards";
import { ExpectedError } from "@/lib/action-result";
import { writeAuditLog } from "@/server/audit/log";
import { db } from "@/server/db";
import {
  session,
  user,
  userPermissionGrants,
} from "@/server/db/schema";

export async function setAdminUserRole({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateAdminUserRoleInput;
}): Promise<void> {
  const targetUser = await getUserForMutation(input.userId);
  if (targetUser.role === input.role) return;

  if (actorUserId === input.userId) {
    throw new ExpectedError("You cannot change your own role.");
  }

  const actorUser = await getUserForMutation(actorUserId);
  ensureRoleMutationAllowed({
    actorRole: actorUser.role,
    nextRole: input.role,
    targetRole: targetUser.role,
  });

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

export async function setAdminUserPermissionGrant({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: UpdateAdminUserPermissionGrantInput;
}): Promise<void> {
  if (actorUserId === input.userId) {
    throw new ExpectedError("You cannot change your own direct grants.");
  }

  const actorUser = await getUserForMutation(actorUserId);
  const targetUser = await getUserForMutation(input.userId);
  const actorPermissions = await getPermissionChecker({
    role: actorUser.role,
    userId: actorUserId,
  });

  if (!actorPermissions.has(input)) {
    throw new ExpectedError(
      "You cannot grant or revoke permissions you do not hold.",
    );
  }

  const permissionLabel = getPermissionGrantLabel(input);

  if (input.intent === "grant") {
    await db
      .insert(userPermissionGrants)
      .values({
        action: input.action,
        grantedByUserId: actorUserId,
        resource: input.resource,
        userId: input.userId,
      })
      .onConflictDoNothing({
        target: [
          userPermissionGrants.userId,
          userPermissionGrants.resource,
          userPermissionGrants.action,
        ],
      });

    await writeAuditLog({
      actorUserId,
      action: "user.permission.grant",
      entityType: "user",
      entityId: input.userId,
      summary: `Granted ${permissionLabel} to ${targetUser.email}.`,
      metadata: {
        permission: createPermissionKey(input),
        targetEmail: targetUser.email,
      },
    });
  } else {
    await db
      .delete(userPermissionGrants)
      .where(
        and(
          eq(userPermissionGrants.userId, input.userId),
          eq(userPermissionGrants.resource, input.resource),
          eq(userPermissionGrants.action, input.action),
        ),
      );

    await writeAuditLog({
      actorUserId,
      action: "user.permission.revoke",
      entityType: "user",
      entityId: input.userId,
      summary: `Revoked ${permissionLabel} from ${targetUser.email}.`,
      metadata: {
        permission: createPermissionKey(input),
        targetEmail: targetUser.email,
      },
    });
  }

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

function getPermissionGrantLabel({
  action,
  resource,
}: Pick<UpdateAdminUserPermissionGrantInput, "action" | "resource">): string {
  const resourceDefinition = getAllPermissionDefinitions().find(
    (definition) => definition.resource === resource,
  );
  const actionDefinition = resourceDefinition?.actions.find(
    (definition) => definition.action === action,
  );

  if (!resourceDefinition || !actionDefinition) {
    return createPermissionKey({ action, resource });
  }

  return `${resourceDefinition.label}: ${actionDefinition.label}`;
}

function ensureRoleMutationAllowed({
  actorRole,
  nextRole,
  targetRole,
}: {
  actorRole: UpdateAdminUserRoleInput["role"];
  nextRole: UpdateAdminUserRoleInput["role"];
  targetRole: UpdateAdminUserRoleInput["role"];
}): void {
  if (actorRole === ROLES.SITE_ADMIN) return;

  if (nextRole === ROLES.SITE_ADMIN || targetRole === ROLES.SITE_ADMIN) {
    throw new ExpectedError("Only site admins can manage site admin roles.");
  }
}

function revalidateUsers(): void {
  revalidatePath("/dashboard/users");
}
