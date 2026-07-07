import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  createPermissionKey,
  getAllPermissionDefinitions,
  isPermissionActionForResource,
  type PermissionGrant,
} from "@/modules/auth/permissions";
import { auth } from "@/server/auth/config";
import {
  contentAdminRole,
  siteAdminRole,
  statement,
  studentRole,
} from "@/server/auth/access-control";
import { ROLES, resolveUserRole, type UserRole } from "@/modules/auth/roles";
import { db } from "@/server/db";
import { userPermissionGrants } from "@/server/db/schema";

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

export interface PermissionChecker {
  grants: PermissionGrant[];
  keys: string[];
  has: (permission: PermissionRequest | PermissionGrant) => boolean;
}

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
  if (!role) redirect("/dashboard");

  const checker = await getPermissionChecker({
    role,
    userId: session.user.id,
  });

  if (!checker.has(permission)) {
    redirect("/dashboard");
  }

  return {
    ...session,
    permissions: checker,
    user: {
      ...session.user,
      role,
    },
  };
}

export async function getPermissionChecker({
  role,
  userId,
}: {
  role: UserRole | null;
  userId: string;
}): Promise<PermissionChecker> {
  return getCachedPermissionChecker(userId, role);
}

const getCachedPermissionChecker = cache(
  async (
    userId: string,
    role: UserRole | null,
  ): Promise<PermissionChecker> => {
    const grants = await getUserPermissionGrants(userId);
    const directGrantKeys = new Set(grants.map(createPermissionKey));

    const keys = getAllPermissionDefinitions().flatMap((definition) =>
      definition.actions
        .filter((item) =>
          hasPermission(role, {
            resource: definition.resource,
            action: item.action,
          }),
        )
        .map((item) =>
          createPermissionKey({
            resource: definition.resource,
            action: item.action,
          }),
        ),
    );

    for (const key of directGrantKeys) {
      if (!keys.includes(key)) keys.push(key);
    }

    return {
      grants,
      has(permission) {
        return (
          hasPermission(role, permission) ||
          directGrantKeys.has(createPermissionKey(permission))
        );
      },
      keys,
    };
  },
);

export function hasPermission(
  role: UserRole | null,
  permission: PermissionRequest | PermissionGrant,
): role is UserRole {
  if (!role) return false;
  if (!isPermissionActionForResource(permission)) return false;

  const roleDefinition = roleDefinitions[role];

  switch (permission.resource) {
    case "announcement": {
      if (!includesAction(statement.announcement, permission.action)) return false;
      return roleDefinition.authorize({
        announcement: [permission.action],
      }).success;
    }
    case "audit": {
      if (!includesAction(statement.audit, permission.action)) return false;
      return roleDefinition.authorize({ audit: [permission.action] }).success;
    }
    case "bulletin": {
      if (!includesAction(statement.bulletin, permission.action)) return false;
      return roleDefinition.authorize({
        bulletin: [permission.action],
      }).success;
    }
    case "course": {
      if (!includesAction(statement.course, permission.action)) return false;
      return roleDefinition.authorize({ course: [permission.action] }).success;
    }
    case "event": {
      if (!includesAction(statement.event, permission.action)) return false;
      return roleDefinition.authorize({ event: [permission.action] }).success;
    }
    case "finance": {
      if (!includesAction(statement.finance, permission.action)) return false;
      return roleDefinition.authorize({ finance: [permission.action] }).success;
    }
    case "fundraising": {
      if (!includesAction(statement.fundraising, permission.action)) return false;
      return roleDefinition.authorize({
        fundraising: [permission.action],
      }).success;
    }
    case "resource": {
      if (!includesAction(statement.resource, permission.action)) return false;
      return roleDefinition.authorize({ resource: [permission.action] }).success;
    }
    case "scholarship": {
      if (!includesAction(statement.scholarship, permission.action)) return false;
      return roleDefinition.authorize({
        scholarship: [permission.action],
      }).success;
    }
    case "lecturer": {
      if (!includesAction(statement.lecturer, permission.action)) return false;
      return roleDefinition.authorize({ lecturer: [permission.action] }).success;
    }
    case "concern": {
      if (!includesAction(statement.concern, permission.action)) return false;
      return roleDefinition.authorize({ concern: [permission.action] }).success;
    }
    case "gallery": {
      if (!includesAction(statement.gallery, permission.action)) return false;
      return roleDefinition.authorize({ gallery: [permission.action] }).success;
    }
    case "spotlight": {
      if (!includesAction(statement.spotlight, permission.action)) return false;
      return roleDefinition.authorize({ spotlight: [permission.action] }).success;
    }
    case "storage": {
      if (!includesAction(statement.storage, permission.action)) return false;
      return roleDefinition.authorize({ storage: [permission.action] }).success;
    }
    case "user": {
      if (!includesAction(statement.user, permission.action)) return false;
      return roleDefinition.authorize({ user: [permission.action] }).success;
    }
    case "session": {
      if (!includesAction(statement.session, permission.action)) return false;
      return roleDefinition.authorize({ session: [permission.action] }).success;
    }
    case "settings": {
      if (!includesAction(statement.settings, permission.action)) return false;
      return roleDefinition.authorize({ settings: [permission.action] }).success;
    }
  }
}

const getUserPermissionGrants = cache(
  async (userId: string): Promise<PermissionGrant[]> => {
    const rows = await db
      .select({
        action: userPermissionGrants.action,
        resource: userPermissionGrants.resource,
      })
      .from(userPermissionGrants)
      .where(eq(userPermissionGrants.userId, userId));

    const grants: PermissionGrant[] = [];

    for (const row of rows) {
      if (!isValidPermissionGrant(row)) continue;
      grants.push(row);
    }

    return grants;
  },
);

function isValidPermissionGrant(value: {
  action: string;
  resource: string;
}): value is PermissionGrant {
  if (!isPermissionResource(value.resource)) return false;
  return isPermissionActionForResource({
    action: value.action,
    resource: value.resource,
  });
}

function isPermissionResource(value: string): value is PermissionResource {
  return getAllPermissionDefinitions().some(
    (definition) => definition.resource === value,
  );
}

function includesAction<TAction extends string>(
  actions: TAction[],
  action: string,
): action is TAction {
  return actions.some((item) => item === action);
}
