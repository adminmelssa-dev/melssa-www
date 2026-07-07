import {
  Archive,
  MailCheck,
  MailWarning,
  PenLine,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BulletinsTable } from "@/modules/bulletin/components/bulletins-table";
import {
  getBulletinsAdminStats,
  getSerializedBulletinIssuePage,
} from "@/modules/bulletin/queries";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requirePermission } from "@/server/auth/guards";

export async function BulletinsAdminPage() {
  const session = await requirePermission({
    resource: "bulletin",
    action: "read",
  });
  const [bulletinPage, stats] = await Promise.all([
    getSerializedBulletinIssuePage(parseDataTableQuery(new URLSearchParams())),
    getBulletinsAdminStats(),
  ]);
  const permissions = {
    canCreate: session.permissions.has({
      resource: "bulletin",
      action: "create",
    }),
    canUpdate: session.permissions.has({
      resource: "bulletin",
      action: "update",
    }),
    canSend: session.permissions.has({
      resource: "bulletin",
      action: "send",
    }),
    canArchive: session.permissions.has({
      resource: "bulletin",
      action: "archive",
    }),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Weekly digest</p>
        <h1 className="font-heading text-2xl font-black">Bulletins</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={MailCheck}
          label="Subscribers"
          value={stats.subscribers}
        />
        <StatCard icon={PenLine} label="Drafts" value={stats.drafts} />
        <StatCard icon={MailCheck} label="Sent" value={stats.sent} />
        <StatCard
          icon={MailWarning}
          label="Delivery issues"
          value={stats.deliveryIssues}
        />
      </section>

      <BulletinsTable
        initialBulletins={bulletinPage.items}
        initialMeta={bulletinPage.meta}
        initialSubscriberCount={stats.subscribers}
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
  icon: typeof Archive;
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
