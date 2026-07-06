"use client";

import * as React from "react";
import {
  Save,
  Settings,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SETTINGS_ROLE_OPTIONS,
  adminSettingsResponseSchema,
  updateSettingsInputSchema,
  type AdminSettingsResponse,
  type NotificationEventType,
  type SiteSettingKey,
  type SiteSettingRow,
  type UpdateSettingsInput,
} from "@/modules/settings/contracts";
import type { UserRole } from "@/modules/auth/roles";
import {
  actionResultSchema,
  type ActionResult,
} from "@/lib/action-result";

const adminSettingsQueryKey = ["admin-settings"];

interface NotificationFormValue {
  eventType: NotificationEventType;
  label: string;
  description: string;
  recipientEmailsText: string;
  recipientRoles: UserRole[];
}

interface SettingsFormValues {
  siteSettings: SiteSettingRow[];
  notificationSettings: NotificationFormValue[];
}

interface SettingsPanelProps {
  canUpdate: boolean;
  initialSettings: AdminSettingsResponse;
}

export function SettingsPanel({
  canUpdate,
  initialSettings,
}: SettingsPanelProps) {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: adminSettingsQueryKey,
    queryFn: fetchAdminSettings,
    initialData: initialSettings,
  });
  const [values, setValues] = React.useState<SettingsFormValues>(() =>
    getInitialSettingsFormValues(initialSettings),
  );

  const updateMutation = useMutation({
    mutationFn: updateAdminSettings,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminSettingsQueryKey });
    },
  });

  function submitSettings(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canUpdate) return;

    const parsedInput = updateSettingsInputSchema.safeParse({
      siteSettings: values.siteSettings.map((setting) => ({
        key: setting.key,
        value: setting.value,
      })),
      notificationSettings: values.notificationSettings.map((setting) => ({
        eventType: setting.eventType,
        recipientEmails: parseEmailList(setting.recipientEmailsText),
        recipientRoles: setting.recipientRoles,
      })),
    });

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ?? "Check the settings values.",
      );
      return;
    }

    updateMutation.mutate(parsedInput.data);
  }

  return (
    <form className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]" onSubmit={submitSettings}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-4" />
            Site Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {values.siteSettings.map((setting) => (
            <SiteSettingControl
              key={setting.key}
              onChange={(value) =>
                setValues((current) => ({
                  ...current,
                  siteSettings: updateSiteSettingValue(
                    current.siteSettings,
                    setting.key,
                    value,
                  ),
                }))
              }
              disabled={!canUpdate}
              setting={setting}
            />
          ))}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Routing</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {values.notificationSettings.map((setting) => (
              <NotificationSettingControl
                key={setting.eventType}
                onEmailsChange={(recipientEmailsText) =>
                  setValues((current) => ({
                    ...current,
                    notificationSettings: updateNotificationEmails(
                      current.notificationSettings,
                      setting.eventType,
                      recipientEmailsText,
                    ),
                  }))
                }
                onRoleToggle={(role, checked) =>
                  setValues((current) => ({
                    ...current,
                    notificationSettings: updateNotificationRole(
                      current.notificationSettings,
                      setting.eventType,
                      role,
                      checked,
                    ),
                  }))
                }
                setting={setting}
                disabled={!canUpdate}
              />
            ))}
          </CardContent>
        </Card>

        {canUpdate ? (
          <div className="flex justify-end">
            <Button
              disabled={updateMutation.isPending || settingsQuery.isFetching}
              type="submit"
            >
              <Save className="size-4" />
              Save settings
            </Button>
          </div>
        ) : null}
      </div>
    </form>
  );
}

function SiteSettingControl({
  disabled,
  onChange,
  setting,
}: {
  disabled: boolean;
  onChange: (value: string) => void;
  setting: SiteSettingRow;
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor={setting.key}>{setting.label}</Label>
        <p className="text-xs text-muted-foreground">{setting.description}</p>
      </div>
      {setting.multiline ? (
        <Textarea
          disabled={disabled}
          id={setting.key}
          maxLength={setting.maxLength}
          onChange={(event) => onChange(event.currentTarget.value)}
          value={setting.value}
        />
      ) : (
        <Input
          disabled={disabled}
          id={setting.key}
          maxLength={setting.maxLength}
          onChange={(event) => onChange(event.currentTarget.value)}
          value={setting.value}
        />
      )}
    </div>
  );
}

function NotificationSettingControl({
  disabled,
  onEmailsChange,
  onRoleToggle,
  setting,
}: {
  disabled: boolean;
  onEmailsChange: (recipientEmailsText: string) => void;
  onRoleToggle: (role: UserRole, checked: boolean) => void;
  setting: NotificationFormValue;
}) {
  return (
    <section className="space-y-3 rounded-lg border p-3">
      <div>
        <h2 className="font-medium">{setting.label}</h2>
        <p className="text-xs text-muted-foreground">{setting.description}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${setting.eventType}-emails`}>Recipient emails</Label>
        <Textarea
          disabled={disabled}
          id={`${setting.eventType}-emails`}
          onChange={(event) => onEmailsChange(event.currentTarget.value)}
          placeholder="one@email.com, two@email.com"
          value={setting.recipientEmailsText}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Recipient roles</p>
        <div className="grid gap-2">
          {SETTINGS_ROLE_OPTIONS.map((option) => (
            <label
              className="flex items-center gap-2 text-sm"
              key={`${setting.eventType}-${option.value}`}
            >
              <input
                checked={setting.recipientRoles.includes(option.value)}
                className="size-4 accent-primary"
                disabled={disabled}
                onChange={(event) =>
                  onRoleToggle(option.value, event.currentTarget.checked)
                }
                type="checkbox"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

async function fetchAdminSettings(): Promise<AdminSettingsResponse> {
  const response = await fetch("/api/admin/settings", {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load settings.",
    );
  }

  return adminSettingsResponseSchema.parse(body);
}

async function updateAdminSettings(
  input: UpdateSettingsInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/settings", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
  const body: unknown = await response.json();
  const result = actionResultSchema.parse(body);

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Settings update failed.");
  }

  return result;
}

function getInitialSettingsFormValues(
  settings: AdminSettingsResponse,
): SettingsFormValues {
  return {
    siteSettings: settings.siteSettings,
    notificationSettings: settings.notificationSettings.map((setting) => ({
      eventType: setting.eventType,
      label: setting.label,
      description: setting.description,
      recipientEmailsText: setting.recipientEmails.join(", "),
      recipientRoles: setting.recipientRoles,
    })),
  };
}

function updateSiteSettingValue(
  settings: SiteSettingRow[],
  key: SiteSettingKey,
  value: string,
): SiteSettingRow[] {
  return settings.map((setting) =>
    setting.key === key ? { ...setting, value } : setting,
  );
}

function updateNotificationEmails(
  settings: NotificationFormValue[],
  eventType: NotificationEventType,
  recipientEmailsText: string,
): NotificationFormValue[] {
  return settings.map((setting) =>
    setting.eventType === eventType
      ? { ...setting, recipientEmailsText }
      : setting,
  );
}

function updateNotificationRole(
  settings: NotificationFormValue[],
  eventType: NotificationEventType,
  role: UserRole,
  checked: boolean,
): NotificationFormValue[] {
  return settings.map((setting) => {
    if (setting.eventType !== eventType) return setting;

    const hasRole = setting.recipientRoles.includes(role);
    if (checked && !hasRole) {
      return {
        ...setting,
        recipientRoles: [...setting.recipientRoles, role],
      };
    }
    if (!checked && hasRole) {
      return {
        ...setting,
        recipientRoles: setting.recipientRoles.filter((item) => item !== role),
      };
    }

    return setting;
  });
}

function parseEmailList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}
