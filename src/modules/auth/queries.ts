import "server-only";

import {
  asc,
  desc,
} from "drizzle-orm";
import type {
  AdminInvitationRow,
  AdminInvitationStatus,
  AdminUserRow,
  PermissionGrantRow,
} from "@/modules/auth/contracts";
import { permissionGrantSchema } from "@/modules/auth/contracts";
import {
  createPermissionKey,
  getAllPermissionDefinitions,
} from "@/modules/auth/permissions";
import { ROLES, type UserRole } from "@/modules/auth/roles";
import { hasPermission } from "@/server/auth/guards";
import { db } from "@/server/db";
import {
  authInvitations,
  user,
  userPermissionGrants,
} from "@/server/db/schema";

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  inheritedPermissionKeys: string[];
  permissionGrants: PermissionGrantRow[];
  emailVerified: boolean;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminInvitationListItem {
  id: string;
  email: string;
  role: UserRole;
  invitedByUserId: string | null;
  acceptedByUserId: string | null;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
  lastSentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function getAdminUsers(): Promise<AdminUserListItem[]> {
  const [rows, grantRows] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt)),
    db
      .select({
        action: userPermissionGrants.action,
        resource: userPermissionGrants.resource,
        userId: userPermissionGrants.userId,
      })
      .from(userPermissionGrants)
      .orderBy(
        asc(userPermissionGrants.resource),
        asc(userPermissionGrants.action),
      ),
  ]);

  const grantsByUserId = new Map<string, PermissionGrantRow[]>();

  for (const row of grantRows) {
    const parsedGrant = permissionGrantSchema.safeParse({
      action: row.action,
      resource: row.resource,
    });

    if (!parsedGrant.success) continue;

    const existingGrants = grantsByUserId.get(row.userId);
    if (existingGrants) {
      existingGrants.push(parsedGrant.data);
    } else {
      grantsByUserId.set(row.userId, [parsedGrant.data]);
    }
  }

  return rows.map((row) => ({
    ...row,
    banned: row.banned ?? false,
    inheritedPermissionKeys: getInheritedPermissionKeys(row.role ?? ROLES.STUDENT),
    permissionGrants: grantsByUserId.get(row.id) ?? [],
    role: row.role ?? ROLES.STUDENT,
  }));
}

export function serializeAdminUser(
  item: AdminUserListItem,
): AdminUserRow {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    image: item.image,
    role: item.role,
    inheritedPermissionKeys: item.inheritedPermissionKeys,
    permissionGrants: item.permissionGrants,
    emailVerified: item.emailVerified,
    banned: item.banned,
    banReason: item.banReason,
    banExpires: item.banExpires?.toISOString() ?? null,
    lastLoginAt: item.lastLoginAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getSerializedAdminUsers(): Promise<AdminUserRow[]> {
  const users = await getAdminUsers();
  return users.map((item) => serializeAdminUser(item));
}

function getInheritedPermissionKeys(role: UserRole): string[] {
  return getAllPermissionDefinitions().flatMap((definition) =>
    definition.actions
      .filter((item) =>
        hasPermission(role, {
          action: item.action,
          resource: definition.resource,
        }),
      )
      .map((item) =>
        createPermissionKey({
          action: item.action,
          resource: definition.resource,
        }),
      ),
  );
}

export async function getAdminInvitations(): Promise<
  AdminInvitationListItem[]
> {
  const rows = await db
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
    .orderBy(desc(authInvitations.createdAt));

  return rows.map((row) => ({
    ...row,
    role: row.role ?? ROLES.STUDENT,
  }));
}

export function serializeAdminInvitation(
  item: AdminInvitationListItem,
): AdminInvitationRow {
  return {
    id: item.id,
    email: item.email,
    role: item.role,
    status: getAdminInvitationStatus(item),
    invitedByUserId: item.invitedByUserId,
    acceptedByUserId: item.acceptedByUserId,
    acceptedAt: item.acceptedAt?.toISOString() ?? null,
    revokedAt: item.revokedAt?.toISOString() ?? null,
    expiresAt: item.expiresAt.toISOString(),
    lastSentAt: item.lastSentAt.toISOString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getSerializedAdminInvitations(): Promise<
  AdminInvitationRow[]
> {
  const invitations = await getAdminInvitations();
  return invitations.map((item) => serializeAdminInvitation(item));
}

export function getAdminInvitationStatus({
  acceptedAt,
  revokedAt,
  expiresAt,
}: Pick<
  AdminInvitationListItem,
  "acceptedAt" | "revokedAt" | "expiresAt"
>): AdminInvitationStatus {
  if (acceptedAt) return "accepted";
  if (revokedAt) return "revoked";
  return expiresAt.getTime() <= Date.now() ? "expired" : "pending";
}
