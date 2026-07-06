import "server-only";

import { desc } from "drizzle-orm";
import type { AdminUserRow } from "@/modules/auth/contracts";
import { ROLES, type UserRole } from "@/modules/auth/roles";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";

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
