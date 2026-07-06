import { z } from "zod";
import { userRoleSchema } from "@/modules/auth/contracts";
import {
  ROLE_LABELS,
  ROLES,
  type UserRole,
} from "@/modules/auth/roles";

export const siteSettingKeySchema = z.union([
  z.literal("site_name"),
  z.literal("site_tagline"),
  z.literal("contact_email"),
  z.literal("support_email"),
  z.literal("resources_notice"),
  z.literal("concerns_notice"),
]);

export const notificationEventTypeSchema = z.union([
  z.literal("announcement.published"),
  z.literal("resource.published"),
  z.literal("event.published"),
  z.literal("concern.submitted"),
]);

export type SiteSettingKey = z.infer<typeof siteSettingKeySchema>;
export type NotificationEventType = z.infer<
  typeof notificationEventTypeSchema
>;

export interface SiteSettingDefinition {
  key: SiteSettingKey;
  label: string;
  description: string;
  defaultValue: string;
  multiline: boolean;
  maxLength: number;
}

export interface NotificationEventDefinition {
  eventType: NotificationEventType;
  label: string;
  description: string;
  defaultRoles: UserRole[];
}

export const SITE_SETTING_DEFINITIONS: SiteSettingDefinition[] = [
  {
    key: "site_name",
    label: "Site Name",
    description: "Primary name used by configurable surfaces.",
    defaultValue: "MELSSA Student Portal",
    multiline: false,
    maxLength: 100,
  },
  {
    key: "site_tagline",
    label: "Site Tagline",
    description: "Short supporting copy for portal surfaces.",
    defaultValue:
      "Academic resources, association updates, and student support.",
    multiline: false,
    maxLength: 180,
  },
  {
    key: "contact_email",
    label: "Contact Email",
    description: "Public-facing association contact inbox.",
    defaultValue: "",
    multiline: false,
    maxLength: 255,
  },
  {
    key: "support_email",
    label: "Support Email",
    description: "Operational inbox for portal support.",
    defaultValue: "",
    multiline: false,
    maxLength: 255,
  },
  {
    key: "resources_notice",
    label: "Resources Notice",
    description: "Optional note displayed near the resource archive.",
    defaultValue: "",
    multiline: true,
    maxLength: 500,
  },
  {
    key: "concerns_notice",
    label: "Concerns Notice",
    description: "Optional note displayed near anonymous concern intake.",
    defaultValue: "",
    multiline: true,
    maxLength: 500,
  },
];

export const NOTIFICATION_EVENT_DEFINITIONS: NotificationEventDefinition[] = [
  {
    eventType: "announcement.published",
    label: "Announcement Published",
    description: "Triggered when an announcement becomes public.",
    defaultRoles: [ROLES.CONTENT_ADMIN, ROLES.SITE_ADMIN],
  },
  {
    eventType: "resource.published",
    label: "Resource Published",
    description: "Triggered when a resource becomes public.",
    defaultRoles: [ROLES.CONTENT_ADMIN, ROLES.SITE_ADMIN],
  },
  {
    eventType: "event.published",
    label: "Event Published",
    description: "Triggered when an event becomes public.",
    defaultRoles: [ROLES.CONTENT_ADMIN, ROLES.SITE_ADMIN],
  },
  {
    eventType: "concern.submitted",
    label: "Concern Submitted",
    description: "Triggered when an anonymous concern is submitted.",
    defaultRoles: [ROLES.CONTENT_ADMIN, ROLES.SITE_ADMIN],
  },
];

export const SETTINGS_ROLE_OPTIONS: {
  value: UserRole;
  label: string;
}[] = [
  { value: ROLES.STUDENT, label: ROLE_LABELS.student },
  { value: ROLES.CONTENT_ADMIN, label: ROLE_LABELS.contentAdmin },
  { value: ROLES.SITE_ADMIN, label: ROLE_LABELS.siteAdmin },
];

export const siteSettingRowSchema = z.object({
  key: siteSettingKeySchema,
  label: z.string(),
  description: z.string(),
  value: z.string(),
  multiline: z.boolean(),
  maxLength: z.number().int().positive(),
});

export const notificationSettingRowSchema = z.object({
  eventType: notificationEventTypeSchema,
  label: z.string(),
  description: z.string(),
  recipientEmails: z.array(z.email()),
  recipientRoles: z.array(userRoleSchema),
});

export const adminSettingsResponseSchema = z.object({
  siteSettings: z.array(siteSettingRowSchema),
  notificationSettings: z.array(notificationSettingRowSchema),
});

export const updateSettingsInputSchema = z.object({
  siteSettings: z.array(
    z.object({
      key: siteSettingKeySchema,
      value: z.string().trim().max(1_000),
    }),
  ),
  notificationSettings: z.array(
    z.object({
      eventType: notificationEventTypeSchema,
      recipientEmails: z.array(z.email()).max(20),
      recipientRoles: z.array(userRoleSchema).max(3),
    }),
  ),
});

export type SiteSettingRow = z.infer<typeof siteSettingRowSchema>;
export type NotificationSettingRow = z.infer<
  typeof notificationSettingRowSchema
>;
export type AdminSettingsResponse = z.infer<
  typeof adminSettingsResponseSchema
>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsInputSchema>;
