import {
  Archive,
  Bell,
  FileText,
  Send,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnnouncementsTable } from "@/modules/announcements/components/announcements-table";
import type { AnnouncementRow } from "@/modules/announcements/contracts";
import { getSerializedAnnouncements } from "@/modules/announcements/queries";
import { requirePermission } from "@/server/auth/guards";

interface AnnouncementsAdminStats {
  totalAnnouncements: number;
  publishedAnnouncements: number;
  draftAnnouncements: number;
  archivedAnnouncements: number;
}

export async function AnnouncementsAdminPage() {
  const session = await requirePermission({
    resource: "announcement",
    action: "read",
  });
  const announcements = await getSerializedAnnouncements();
  const stats = getAnnouncementsAdminStats(announcements);
  const permissions = {
    canCreate: session.permissions.has({
      resource: "announcement",
      action: "create",
    }),
    canUpdate: session.permissions.has({
      resource: "announcement",
      action: "update",
    }),
    canDelete: session.permissions.has({
      resource: "announcement",
      action: "delete",
    }),
    canPublish: session.permissions.has({
      resource: "announcement",
      action: "publish",
    }),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Association updates</p>
        <h1 className="font-heading text-2xl font-black">Announcements</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Bell}
          label="Announcements"
          value={stats.totalAnnouncements}
        />
        <StatCard
          icon={Send}
          label="Published"
          value={stats.publishedAnnouncements}
        />
        <StatCard
          icon={FileText}
          label="Drafts"
          value={stats.draftAnnouncements}
        />
        <StatCard
          icon={Archive}
          label="Archived"
          value={stats.archivedAnnouncements}
        />
      </section>

      <AnnouncementsTable
        initialAnnouncements={announcements}
        permissions={permissions}
      />
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
  icon: typeof Bell;
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

function getAnnouncementsAdminStats(
  announcements: AnnouncementRow[],
): AnnouncementsAdminStats {
  return {
    totalAnnouncements: announcements.length,
    publishedAnnouncements: announcements.filter(
      (announcement) => announcement.status === "published",
    ).length,
    draftAnnouncements: announcements.filter(
      (announcement) => announcement.status === "draft",
    ).length,
    archivedAnnouncements: announcements.filter(
      (announcement) => announcement.status === "archived",
    ).length,
  };
}
