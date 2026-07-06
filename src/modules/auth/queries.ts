import "server-only";

import { desc } from "drizzle-orm";
import type {
  AdminInvitationRow,
  AdminInvitationStatus,
  AdminUserRow,
} from "@/modules/auth/contracts";
import { ROLES, type UserRole } from "@/modules/auth/roles";
import { db } from "@/server/db";
import { authInvitations, user } from "@/server/db/schema";

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
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
  const rows = await db
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
    .orderBy(desc(user.createdAt));

  return rows.map((row) => ({
    ...row,
    banned: row.banned ?? false,
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
