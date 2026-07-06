export const ROLES: {
  STUDENT: "student";
  CONTENT_ADMIN: "contentAdmin";
  SITE_ADMIN: "siteAdmin";
} = {
  STUDENT: "student",
  CONTENT_ADMIN: "contentAdmin",
  SITE_ADMIN: "siteAdmin",
};

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const CONTENT_ADMIN_ROLES: UserRole[] = [
  ROLES.CONTENT_ADMIN,
  ROLES.SITE_ADMIN,
];

export const SITE_ADMIN_ROLES: UserRole[] = [ROLES.SITE_ADMIN];

const userRoles: UserRole[] = [
  ROLES.STUDENT,
  ROLES.CONTENT_ADMIN,
  ROLES.SITE_ADMIN,
];

export function isUserRole(value: string): value is UserRole {
  return userRoles.some((role) => role === value);
}

export function resolveUserRole(
  value: string | null | undefined,
): UserRole | null {
  if (!value) return null;
  return isUserRole(value) ? value : null;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  contentAdmin: "Content Admin",
  siteAdmin: "Site Admin",
};
