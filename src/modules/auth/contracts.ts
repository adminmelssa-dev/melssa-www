import { z } from "zod";
import {
  isPermissionActionForResource,
  isPermissionResource,
  type PermissionResource,
} from "@/modules/auth/permissions";
import { ROLES } from "@/modules/auth/roles";
import { dataTablePageMetaSchema } from "@/lib/data-table-query";

export const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email());

export const userRoleSchema = z.union([
  z.literal(ROLES.STUDENT),
  z.literal(ROLES.CONTENT_ADMIN),
  z.literal(ROLES.SITE_ADMIN),
]);

export const permissionResourceSchema = z.custom<PermissionResource>(
  (value) => typeof value === "string" && isPermissionResource(value),
  "Unsupported permission resource.",
);

export const permissionGrantSchema = z
  .object({
    resource: permissionResourceSchema,
    action: z.string().trim().min(1).max(80),
  })
  .superRefine((value, ctx) => {
    if (!isPermissionActionForResource(value)) {
      ctx.addIssue({
        code: "custom",
        path: ["action"],
        message: "Unsupported permission action for this resource.",
      });
    }
  });

export const adminUserRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.string().nullable(),
  role: userRoleSchema,
  inheritedPermissionKeys: z.array(z.string()),
  permissionGrants: z.array(permissionGrantSchema),
  emailVerified: z.boolean(),
  banned: z.boolean(),
  banReason: z.string().nullable(),
  banExpires: z.string().nullable(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminUsersResponseSchema = z.object({
  meta: dataTablePageMetaSchema,
  users: z.array(adminUserRowSchema),
});

export const adminInvitationStatusSchema = z.union([
  z.literal("pending"),
  z.literal("expired"),
  z.literal("accepted"),
  z.literal("revoked"),
]);

export const adminInvitationRowSchema = z.object({
  id: z.string(),
  email: z.email(),
  role: userRoleSchema,
  status: adminInvitationStatusSchema,
  invitedByUserId: z.string().nullable(),
  acceptedByUserId: z.string().nullable(),
  acceptedAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
  expiresAt: z.string(),
  lastSentAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminInvitationsResponseSchema = z.object({
  invitations: z.array(adminInvitationRowSchema),
  meta: dataTablePageMetaSchema,
});

export const inviteAdminUserInputSchema = z.object({
  email: normalizedEmailSchema,
  role: userRoleSchema,
});

export const adminInvitationMutationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("resend"),
    invitationId: z.string().min(1),
  }),
  z.object({
    type: z.literal("revoke"),
    invitationId: z.string().min(1),
  }),
]);

export const acceptAuthInvitationInputSchema = z.object({
  token: z.string().trim().min(32).max(256),
});

export const authInvitationPreviewSchema = z.object({
  email: z.email(),
  role: userRoleSchema,
  status: adminInvitationStatusSchema,
  expiresAt: z.string().nullable(),
});

export const updateAdminUserRoleInputSchema = z.object({
  userId: z.string().min(1),
  role: userRoleSchema,
});

export const updateAdminUserAccessInputSchema = z.object({
  userId: z.string().min(1),
  intent: z.union([z.literal("ban"), z.literal("unban")]),
  banReason: z.string().trim().max(500).optional(),
});

export const updateAdminUserVerificationInputSchema = z.object({
  userId: z.string().min(1),
  intent: z.union([z.literal("verify"), z.literal("unverify")]),
});

export const updateAdminUserPermissionGrantInputSchema = permissionGrantSchema
  .extend({
    userId: z.string().min(1),
    intent: z.union([z.literal("grant"), z.literal("revoke")]),
  });

export const adminUserMutationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("role"),
    payload: updateAdminUserRoleInputSchema,
  }),
  z.object({
    type: z.literal("access"),
    payload: updateAdminUserAccessInputSchema,
  }),
  z.object({
    type: z.literal("verification"),
    payload: updateAdminUserVerificationInputSchema,
  }),
  z.object({
    type: z.literal("permission"),
    payload: updateAdminUserPermissionGrantInputSchema,
  }),
]);

export type AdminUserRow = z.infer<typeof adminUserRowSchema>;
export type AdminUsersResponse = z.infer<typeof adminUsersResponseSchema>;
export type AdminInvitationStatus = z.infer<
  typeof adminInvitationStatusSchema
>;
export type AdminInvitationRow = z.infer<typeof adminInvitationRowSchema>;
export type AdminInvitationsResponse = z.infer<
  typeof adminInvitationsResponseSchema
>;
export type InviteAdminUserInput = z.infer<
  typeof inviteAdminUserInputSchema
>;
export type AdminInvitationMutation = z.infer<
  typeof adminInvitationMutationSchema
>;
export type AcceptAuthInvitationInput = z.infer<
  typeof acceptAuthInvitationInputSchema
>;
export type AuthInvitationPreview = z.infer<
  typeof authInvitationPreviewSchema
>;
export type AdminUserMutation = z.infer<typeof adminUserMutationSchema>;
export type PermissionGrantRow = z.infer<typeof permissionGrantSchema>;
export type UpdateAdminUserRoleInput = z.infer<
  typeof updateAdminUserRoleInputSchema
>;
export type UpdateAdminUserAccessInput = z.infer<
  typeof updateAdminUserAccessInputSchema
>;
export type UpdateAdminUserVerificationInput = z.infer<
  typeof updateAdminUserVerificationInputSchema
>;
export type UpdateAdminUserPermissionGrantInput = z.infer<
  typeof updateAdminUserPermissionGrantInputSchema
>;
