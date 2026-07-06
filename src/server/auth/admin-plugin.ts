import { admin } from "better-auth/plugins";
import { ROLES } from "@/modules/auth/roles";
import {
  ac,
  contentAdminRole,
  siteAdminRole,
  studentRole,
} from "@/server/auth/access-control";

export function createAdminPlugin() {
  return admin({
    ac,
    adminRoles: [ROLES.SITE_ADMIN],
    defaultRole: ROLES.STUDENT,
    roles: {
      [ROLES.STUDENT]: studentRole,
      [ROLES.CONTENT_ADMIN]: contentAdminRole,
      [ROLES.SITE_ADMIN]: siteAdminRole,
    },
  });
}
