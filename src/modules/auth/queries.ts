import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  type SQL,
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
import {
  createDataTablePage,
  getDataTableFilterValues,
  getDataTableOffset,
  type DataTablePage,
  type DataTableQuery,
} from "@/lib/data-table-query";
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

export interface UsersAdminStats {
  totalUsers: number;
  siteAdmins: number;
  verifiedUsers: number;
  restrictedUsers: number;
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

export async function getAdminUserPage(
  query: DataTableQuery,
): Promise<DataTablePage<AdminUserListItem>> {
  const where = getAdminUserWhere(query);
  const [totalRows, rows] = await Promise.all([
    db.$count(user, where),
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
      .where(where)
      .orderBy(...getAdminUserOrderBy(query))
      .limit(query.pageSize)
      .offset(getDataTableOffset(query)),
  ]);
  const userIds = rows.map((row) => row.id);
  const grantRows =
    userIds.length > 0
      ? await db
          .select({
            action: userPermissionGrants.action,
            resource: userPermissionGrants.resource,
            userId: userPermissionGrants.userId,
          })
          .from(userPermissionGrants)
          .where(inArray(userPermissionGrants.userId, userIds))
          .orderBy(
            asc(userPermissionGrants.resource),
            asc(userPermissionGrants.action),
          )
      : [];
  const grantsByUserId = getGrantsByUserId(grantRows);

  return createDataTablePage({
    items: rows.map((row) => ({
      ...row,
      banned: row.banned ?? false,
      inheritedPermissionKeys: getInheritedPermissionKeys(
        row.role ?? ROLES.STUDENT,
      ),
      permissionGrants: grantsByUserId.get(row.id) ?? [],
      role: row.role ?? ROLES.STUDENT,
    })),
    query,
    totalRows,
  });
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

export async function getSerializedAdminUserPage(
  query: DataTableQuery,
): Promise<DataTablePage<AdminUserRow>> {
  const page = await getAdminUserPage(query);
  return createDataTablePage({
    items: page.items.map((item) => serializeAdminUser(item)),
    query,
    totalRows: page.meta.totalRows,
  });
}

export async function getUsersAdminStats(): Promise<UsersAdminStats> {
  const [totalUsers, siteAdmins, verifiedUsers, restrictedUsers] =
    await Promise.all([
      db.$count(user),
      db.$count(user, eq(user.role, ROLES.SITE_ADMIN)),
      db.$count(user, eq(user.emailVerified, true)),
      db.$count(user, eq(user.banned, true)),
    ]);

  return {
    restrictedUsers,
    siteAdmins,
    totalUsers,
    verifiedUsers,
  };
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

function getGrantsByUserId(
  grantRows: {
    action: string;
    resource: string;
    userId: string;
  }[],
): Map<string, PermissionGrantRow[]> {
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

  return grantsByUserId;
}

function getAdminUserWhere(query: DataTableQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const roleFilters = getValidRoleFilters(
    getDataTableFilterValues(query, "role"),
  );
  const accessFilters = getDataTableFilterValues(query, "accessStatus");
  const verificationFilters = getDataTableFilterValues(
    query,
    "verificationStatus",
  );

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(ilike(user.name, pattern), ilike(user.email, pattern));
    if (searchCondition) conditions.push(searchCondition);
  }

  if (roleFilters.length > 0) {
    conditions.push(inArray(user.role, roleFilters));
  }

  if (accessFilters.length === 1) {
    const accessFilter = accessFilters[0];
    if (accessFilter === "restricted") {
      conditions.push(eq(user.banned, true));
    } else if (accessFilter === "active") {
      const activeCondition = or(eq(user.banned, false), isNull(user.banned));
      if (activeCondition) conditions.push(activeCondition);
    }
  }

  if (verificationFilters.length === 1) {
    const verificationFilter = verificationFilters[0];
    if (verificationFilter === "verified") {
      conditions.push(eq(user.emailVerified, true));
    } else if (verificationFilter === "unverified") {
      conditions.push(eq(user.emailVerified, false));
    }
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getAdminUserOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "name":
      return isAscending
        ? [asc(user.name), asc(user.email)]
        : [desc(user.name), desc(user.email)];
    case "role":
      return isAscending
        ? [asc(user.role), asc(user.email)]
        : [desc(user.role), asc(user.email)];
    case "emailVerified":
    case "verificationStatus":
      return isAscending
        ? [asc(user.emailVerified), asc(user.email)]
        : [desc(user.emailVerified), asc(user.email)];
    case "accessStatus":
      return isAscending
        ? [asc(user.banned), asc(user.email)]
        : [desc(user.banned), asc(user.email)];
    case "lastLoginAt":
      return isAscending
        ? [asc(user.lastLoginAt), asc(user.email)]
        : [desc(user.lastLoginAt), asc(user.email)];
    default:
      return isAscending
        ? [asc(user.createdAt), asc(user.email)]
        : [desc(user.createdAt), asc(user.email)];
  }
}

function getValidRoleFilters(values: string[]): UserRole[] {
  const roles: UserRole[] = [];

  for (const value of values) {
    const parsedRole = userRoleFromValue(value);
    if (parsedRole) roles.push(parsedRole);
  }

  return roles;
}

function userRoleFromValue(value: string): UserRole | null {
  if (value === ROLES.STUDENT) return ROLES.STUDENT;
  if (value === ROLES.CONTENT_ADMIN) return ROLES.CONTENT_ADMIN;
  if (value === ROLES.SITE_ADMIN) return ROLES.SITE_ADMIN;
  return null;
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

export async function getSerializedAdminInvitationPage(
  query: DataTableQuery,
): Promise<DataTablePage<AdminInvitationRow>> {
  const now = new Date();
  const where = getAdminInvitationWhere(query, now);
  const totalRows = await db.$count(authInvitations, where);
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
    .where(where)
    .orderBy(...getAdminInvitationOrderBy(query))
    .limit(query.pageSize)
    .offset(getDataTableOffset(query));

  return createDataTablePage({
    items: rows
      .map((row) => ({
        ...row,
        role: row.role ?? ROLES.STUDENT,
      }))
      .map((item) => serializeAdminInvitation(item)),
    query,
    totalRows,
  });
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

function getAdminInvitationWhere(
  query: DataTableQuery,
  now: Date,
): SQL | undefined {
  const conditions: SQL[] = [];
  const roleFilters = getValidRoleFilters(getDataTableFilterValues(query, "role"));
  const statusFilters = getValidInvitationStatusFilters(
    getDataTableFilterValues(query, "status"),
  );

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchCondition = or(ilike(authInvitations.email, pattern));
    if (searchCondition) conditions.push(searchCondition);
  }

  if (roleFilters.length > 0) {
    conditions.push(inArray(authInvitations.role, roleFilters));
  }

  const statusCondition = getInvitationStatusCondition(statusFilters, now);
  if (statusCondition) conditions.push(statusCondition);

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getAdminInvitationOrderBy(query: DataTableQuery) {
  const isAscending = query.sortDirection === "asc";

  switch (query.sortBy) {
    case "email":
      return isAscending
        ? [asc(authInvitations.email), asc(authInvitations.id)]
        : [desc(authInvitations.email), desc(authInvitations.id)];
    case "role":
      return isAscending
        ? [asc(authInvitations.role), asc(authInvitations.email)]
        : [desc(authInvitations.role), asc(authInvitations.email)];
    case "lastSentAt":
      return isAscending
        ? [asc(authInvitations.lastSentAt), asc(authInvitations.id)]
        : [desc(authInvitations.lastSentAt), desc(authInvitations.id)];
    default:
      return isAscending
        ? [asc(authInvitations.createdAt), asc(authInvitations.id)]
        : [desc(authInvitations.createdAt), desc(authInvitations.id)];
  }
}

function getValidInvitationStatusFilters(
  values: string[],
): AdminInvitationStatus[] {
  return values.flatMap((value) => {
    if (value === "pending") return ["pending"];
    if (value === "expired") return ["expired"];
    if (value === "accepted") return ["accepted"];
    if (value === "revoked") return ["revoked"];
    return [];
  });
}

function getInvitationStatusCondition(
  values: AdminInvitationStatus[],
  now: Date,
): SQL | undefined {
  if (values.length === 0) return undefined;

  const statusConditions = values.flatMap((value) => {
    if (value === "accepted") return [isNotNull(authInvitations.acceptedAt)];
    if (value === "revoked") {
      return [
        and(
          isNull(authInvitations.acceptedAt),
          isNotNull(authInvitations.revokedAt),
        ),
      ];
    }
    if (value === "expired") {
      return [
        and(
          isNull(authInvitations.acceptedAt),
          isNull(authInvitations.revokedAt),
          lte(authInvitations.expiresAt, now),
        ),
      ];
    }
    return [
      and(
        isNull(authInvitations.acceptedAt),
        isNull(authInvitations.revokedAt),
        gt(authInvitations.expiresAt, now),
      ),
    ];
  });

  return or(...statusConditions);
}
