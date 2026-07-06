import { z } from "zod";
import { ROLES } from "@/modules/auth/roles";

export const userRoleSchema = z.union([
  z.literal(ROLES.STUDENT),
  z.literal(ROLES.CONTENT_ADMIN),
  z.literal(ROLES.SITE_ADMIN),
]);

export const adminUserRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.string().nullable(),
  role: userRoleSchema,
  emailVerified: z.boolean(),
  banned: z.boolean(),
  banReason: z.string().nullable(),
  banExpires: z.string().nullable(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminUsersResponseSchema = z.object({
  users: z.array(adminUserRowSchema),
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
]);

export type AdminUserRow = z.infer<typeof adminUserRowSchema>;
export type AdminUsersResponse = z.infer<typeof adminUsersResponseSchema>;
export type AdminUserMutation = z.infer<typeof adminUserMutationSchema>;
export type UpdateAdminUserRoleInput = z.infer<
  typeof updateAdminUserRoleInputSchema
>;
export type UpdateAdminUserAccessInput = z.infer<
  typeof updateAdminUserAccessInputSchema
>;
export type UpdateAdminUserVerificationInput = z.infer<
  typeof updateAdminUserVerificationInputSchema
>;
