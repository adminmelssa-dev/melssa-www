import { describe, expect, test } from "bun:test";
import {
  ROLE_LABELS,
  ROLES,
  isUserRole,
  resolveUserRole,
} from "../../../src/modules/auth/roles";

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
});
