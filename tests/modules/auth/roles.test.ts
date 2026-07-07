import { describe, expect, test } from "bun:test";
import {
  ROLE_LABELS,
  ROLES,
  isUserRole,
  resolveUserRole,
} from "../../../src/modules/auth/roles";
import {
  createPermissionKey,
  getAllPermissionKeys,
  isPermissionActionForResource,
  isPermissionResource,
} from "../../../src/modules/auth/permissions";
import {
  contentAdminRole,
  siteAdminRole,
  studentRole,
} from "../../../src/server/auth/access-control";

describe("auth roles", () => {
  test("recognizes supported role values", () => {
    expect(isUserRole(ROLES.STUDENT)).toBe(true);
    expect(isUserRole(ROLES.CONTENT_ADMIN)).toBe(true);
    expect(isUserRole(ROLES.SITE_ADMIN)).toBe(true);
    expect(isUserRole("owner")).toBe(false);
  });

  test("resolves nullable role inputs", () => {
    expect(resolveUserRole(ROLES.SITE_ADMIN)).toBe(ROLES.SITE_ADMIN);
    expect(resolveUserRole(null)).toBeNull();
    expect(resolveUserRole(undefined)).toBeNull();
    expect(resolveUserRole("unknown")).toBeNull();
  });

  test("keeps labels available for every role", () => {
    expect(ROLE_LABELS[ROLES.STUDENT]).toBe("Student");
    expect(ROLE_LABELS[ROLES.CONTENT_ADMIN]).toBe("Content Admin");
    expect(ROLE_LABELS[ROLES.SITE_ADMIN]).toBe("Site Admin");
  });

  test("keeps student access out of admin workspaces", () => {
    expect(studentRole.authorize({ concern: ["create"] }).success).toBe(true);
    expect(studentRole.authorize({ announcement: ["read"] }).success).toBe(false);
    expect(studentRole.authorize({ course: ["read"] }).success).toBe(false);
    expect(studentRole.authorize({ event: ["read"] }).success).toBe(false);
    expect(studentRole.authorize({ resource: ["read"] }).success).toBe(false);
    expect(studentRole.authorize({ lecturer: ["read"] }).success).toBe(false);
    expect(studentRole.authorize({ gallery: ["read"] }).success).toBe(false);
    expect(studentRole.authorize({ spotlight: ["read"] }).success).toBe(false);
    expect(studentRole.authorize({ bulletin: ["read"] }).success).toBe(false);
    expect(studentRole.authorize({ finance: ["read"] }).success).toBe(false);
    expect(studentRole.authorize({ fundraising: ["read"] }).success).toBe(false);
    expect(studentRole.authorize({ scholarship: ["read"] }).success).toBe(
      false,
    );
  });

  test("keeps admin roles authorized for management reads", () => {
    expect(
      contentAdminRole.authorize({ announcement: ["read"] }).success,
    ).toBe(true);
    expect(contentAdminRole.authorize({ bulletin: ["send"] }).success).toBe(true);
    expect(contentAdminRole.authorize({ finance: ["read"] }).success).toBe(
      false,
    );
    expect(siteAdminRole.authorize({ audit: ["read"] }).success).toBe(true);
    expect(siteAdminRole.authorize({ finance: ["publish"] }).success).toBe(true);
    expect(siteAdminRole.authorize({ fundraising: ["respond"] }).success).toBe(
      true,
    );
    expect(siteAdminRole.authorize({ scholarship: ["publish"] }).success).toBe(
      true,
    );
    expect(
      siteAdminRole.authorize({ user: ["manage-permissions"] }).success,
    ).toBe(true);
  });

  test("keeps direct permission grants bounded to the registry", () => {
    expect(isPermissionResource("finance")).toBe(true);
    expect(isPermissionResource("payroll")).toBe(false);
    expect(
      isPermissionActionForResource({
        resource: "fundraising",
        action: "respond",
      }),
    ).toBe(true);
    expect(
      isPermissionActionForResource({
        resource: "scholarship",
        action: "respond",
      }),
    ).toBe(false);
    expect(
      getAllPermissionKeys().includes(
        createPermissionKey({
          resource: "user",
          action: "manage-permissions",
        }),
      ),
    ).toBe(true);
  });
});
