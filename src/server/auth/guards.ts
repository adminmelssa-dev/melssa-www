import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import {
  contentAdminRole,
  siteAdminRole,
  statement,
  studentRole,
} from "@/server/auth/access-control";
import { ROLES, resolveUserRole, type UserRole } from "@/modules/auth/roles";

type AccessStatement = typeof statement;

export type PermissionResource = keyof AccessStatement;

export type PermissionRequest = {
  [TResource in PermissionResource]: {
    resource: TResource;
    action: AccessStatement[TResource][number];
  };
}[PermissionResource];

const roleDefinitions = {
  [ROLES.STUDENT]: studentRole,
  [ROLES.CONTENT_ADMIN]: contentAdminRole,
  [ROLES.SITE_ADMIN]: siteAdminRole,
};

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/sign-in?force=true");
  return session;
}

export async function requireRole(roles: UserRole[]) {
  const session = await requireAuth();
  const role = resolveUserRole(session.user.role);

  if (!role || !roles.includes(role)) {
    redirect("/dashboard");
  }

  return {
    ...session,
    user: {
      ...session.user,
      role,
    },
  };
}

export async function requirePermission(permission: PermissionRequest) {
  const session = await requireAuth();
  const role = resolveUserRole(session.user.role);

  if (!hasPermission(role, permission)) {
    redirect("/dashboard");
  }

  return {
    ...session,
    user: {
      ...session.user,
      role,
    },
  };
}

export function hasPermission(
  role: UserRole | null,
  permission: PermissionRequest,
): role is UserRole {
  if (!role) return false;

  const roleDefinition = roleDefinitions[role];

  switch (permission.resource) {
    case "announcement":
      return roleDefinition.authorize({
        announcement: [permission.action],
      }).success;
    case "audit":
      return roleDefinition.authorize({ audit: [permission.action] }).success;
    case "bulletin":
      return roleDefinition.authorize({
        bulletin: [permission.action],
      }).success;
    case "course":
      return roleDefinition.authorize({ course: [permission.action] }).success;
    case "event":
      return roleDefinition.authorize({ event: [permission.action] }).success;
    case "resource":
      return roleDefinition.authorize({ resource: [permission.action] }).success;
    case "lecturer":
      return roleDefinition.authorize({ lecturer: [permission.action] }).success;
    case "concern":
      return roleDefinition.authorize({ concern: [permission.action] }).success;
    case "gallery":
      return roleDefinition.authorize({ gallery: [permission.action] }).success;
    case "spotlight":
      return roleDefinition.authorize({ spotlight: [permission.action] }).success;
    case "storage":
      return roleDefinition.authorize({ storage: [permission.action] }).success;
    case "user":
      return roleDefinition.authorize({ user: [permission.action] }).success;
    case "session":
      return roleDefinition.authorize({ session: [permission.action] }).success;
    case "settings":
      return roleDefinition.authorize({ settings: [permission.action] }).success;
  }
}
