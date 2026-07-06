import {
  BellRing,
  Mail,
  Settings,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettingsPanel } from "@/modules/settings/components/settings-panel";
import { getAdminSettings } from "@/modules/settings/queries";
import { hasPermission, requirePermission } from "@/server/auth/guards";

export async function SettingsAdminPage() {
  const session = await requirePermission({
    resource: "settings",
    action: "read",
  });
  const settings = await getAdminSettings();
  const canUpdate = hasPermission(session.user.role, {
    resource: "settings",
    action: "update",
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Portal configuration</p>
        <h1 className="font-heading text-2xl font-black">Settings</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Settings}
          label="Site Settings"
          value={settings.siteSettings.length}
        />
        <StatCard
          icon={BellRing}
          label="Notification Events"
          value={settings.notificationSettings.length}
        />
        <StatCard
          icon={Mail}
          label="Custom Recipients"
          value={settings.notificationSettings.reduce(
            (total, item) => total + item.recipientEmails.length,
            0,
          )}
        />
      </section>

      <SettingsPanel canUpdate={canUpdate} initialSettings={settings} />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Settings;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
        <div>
          <CardTitle className="text-2xl font-black">{value}</CardTitle>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardHeader>
    </Card>
  );
}
