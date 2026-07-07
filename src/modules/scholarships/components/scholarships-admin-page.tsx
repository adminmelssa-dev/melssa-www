import { Archive, Award, Send, Workflow } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScholarshipsTable } from "@/modules/scholarships/components/scholarships-table";
import type { ScholarshipProgramRow } from "@/modules/scholarships/contracts";
import { getSerializedScholarshipPrograms } from "@/modules/scholarships/queries";
import { requirePermission } from "@/server/auth/guards";

interface ScholarshipStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

export async function ScholarshipsAdminPage() {
  const session = await requirePermission({
    resource: "scholarship",
    action: "read",
  });
  const programs = await getSerializedScholarshipPrograms();
  const stats = getScholarshipStats(programs);
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

      <ScholarshipsTable permissions={permissions} programs={programs} />
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

function getScholarshipStats(
  programs: ScholarshipProgramRow[],
): ScholarshipStats {
  return {
    total: programs.length,
    published: programs.filter((program) => program.status === "published")
      .length,
    draft: programs.filter((program) => program.status === "draft").length,
    archived: programs.filter((program) => program.status === "archived")
      .length,
  };
}
