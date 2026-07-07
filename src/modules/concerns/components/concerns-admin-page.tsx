import {
  Archive,
  CheckCircle2,
  Inbox,
  MessageSquareText,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConcernsTable } from "@/modules/concerns/components/concerns-table";
import type { ConcernRow } from "@/modules/concerns/contracts";
import { getSerializedConcerns } from "@/modules/concerns/queries";
import { requirePermission } from "@/server/auth/guards";

interface ConcernsAdminStats {
  totalConcerns: number;
  newConcerns: number;
  resolvedConcerns: number;
  archivedConcerns: number;
}

export async function ConcernsAdminPage() {
  const session = await requirePermission({
    resource: "concern",
    action: "read",
  });
  const concerns = await getSerializedConcerns();
  const stats = getConcernsAdminStats(concerns);
  const permissions = {
    canUpdate: session.permissions.has({
      resource: "concern",
      action: "update",
    }),
    canArchive: session.permissions.has({
      resource: "concern",
      action: "archive",
    }),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Student support</p>
        <h1 className="font-heading text-2xl font-black">Concerns</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={MessageSquareText}
          label="Concerns"
          value={stats.totalConcerns}
        />
        <StatCard icon={Inbox} label="New" value={stats.newConcerns} />
        <StatCard
          icon={CheckCircle2}
          label="Resolved"
          value={stats.resolvedConcerns}
        />
        <StatCard
          icon={Archive}
          label="Archived"
          value={stats.archivedConcerns}
        />
      </section>

      <ConcernsTable initialConcerns={concerns} permissions={permissions} />
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
  icon: typeof MessageSquareText;
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

function getConcernsAdminStats(concerns: ConcernRow[]): ConcernsAdminStats {
  return {
    totalConcerns: concerns.length,
    newConcerns: concerns.filter((concern) => concern.status === "new").length,
    resolvedConcerns: concerns.filter((concern) => concern.status === "resolved")
      .length,
    archivedConcerns: concerns.filter((concern) => concern.status === "archived")
      .length,
  };
}
