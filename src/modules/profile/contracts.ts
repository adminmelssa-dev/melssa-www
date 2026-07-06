import { z } from "zod";

export const passkeyListItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  deviceType: z.string().nullable(),
  backedUp: z.boolean(),
  createdAtLabel: z.string().min(1),
});

export const sessionListItemSchema = z.object({
  id: z.string().min(1),
  deviceLabel: z.string().min(1),
  ipAddress: z.string().nullable(),
  isCurrent: z.boolean(),
  createdAtLabel: z.string().min(1),
  lastActiveAtLabel: z.string().min(1),
  expiresAtLabel: z.string().min(1),
});

export const profileSessionMutationSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("revoke"),
    sessionId: z.string().min(1),
  }),
  z.object({
    intent: z.literal("revokeOther"),
  }),
]);

export type PasskeyListItem = z.infer<typeof passkeyListItemSchema>;
export type SessionListItem = z.infer<typeof sessionListItemSchema>;
export type ProfileSessionMutation = z.infer<
  typeof profileSessionMutationSchema
>;
