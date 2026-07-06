import { z } from "zod";

export const auditMetadataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const auditMetadataSchema = z.record(z.string(), auditMetadataValueSchema);

export const auditActorSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
  })
  .nullable();

export const auditLogRowSchema = z.object({
  id: z.number().int().positive(),
  actor: auditActorSchema,
  action: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().nullable(),
  summary: z.string().min(1),
  metadata: auditMetadataSchema,
  createdAt: z.string().min(1),
});

export const adminAuditLogsResponseSchema = z.object({
  auditLogs: z.array(auditLogRowSchema),
});

export type AuditMetadataValue = z.infer<typeof auditMetadataValueSchema>;
export type AuditMetadata = z.infer<typeof auditMetadataSchema>;
export type AuditActor = z.infer<typeof auditActorSchema>;
export type AuditLogRow = z.infer<typeof auditLogRowSchema>;
export type AdminAuditLogsResponse = z.infer<
  typeof adminAuditLogsResponseSchema
>;
