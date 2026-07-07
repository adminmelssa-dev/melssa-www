import { Archive, Award, Send, Workflow } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScholarshipsTable } from "@/modules/scholarships/components/scholarships-table";
import {
  getScholarshipAdminStats,
  getSerializedScholarshipProgramPage,
} from "@/modules/scholarships/queries";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requirePermission } from "@/server/auth/guards";

export async function ScholarshipsAdminPage() {
  const session = await requirePermission({
    resource: "scholarship",
    action: "read",
  });
  const [programPage, stats] = await Promise.all([
    getSerializedScholarshipProgramPage(
      parseDataTableQuery(new URLSearchParams()),
    ),
    getScholarshipAdminStats(),
  ]);
  const permissions = {
    canCreate: session.permissions.has({
      resource: "scholarship",
      action: "create",
    }),
    canUpdate: session.permissions.has({
      resource: "scholarship",
      action: "update",
    }),
    canDelete: session.permissions.has({
      resource: "scholarship",
      action: "delete",
    }),
    canPublish: session.permissions.has({
      resource: "scholarship",
      action: "publish",
    }),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Student Support</p>
        <h1 className="font-heading text-2xl font-black">Scholarships</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Award} label="Programmes" value={stats.total} />
        <StatCard icon={Send} label="Published" value={stats.published} />
        <StatCard icon={Workflow} label="Drafts" value={stats.draft} />
        <StatCard icon={Archive} label="Archived" value={stats.archived} />
      </section>

      <ScholarshipsTable
        initialMeta={programPage.meta}
        permissions={permissions}
        programs={programPage.items}
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
  icon: typeof Award;
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
