import {
  Clock3,
  Fingerprint,
  History,
  UserRoundCheck,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuditTable } from "@/modules/audit/components/audit-table";
import type { AuditLogRow } from "@/modules/audit/contracts";
import { getSerializedAuditLogs } from "@/modules/audit/queries";
import { requirePermission } from "@/server/auth/guards";

interface AuditAdminStats {
  totalEntries: number;
  actorCount: number;
  actionCount: number;
  recentEntries: number;
}

export async function AuditAdminPage() {
  await requirePermission({ resource: "audit", action: "read" });
  const auditLogs = await getSerializedAuditLogs();
  const stats = getAuditStats(auditLogs);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Administrative history</p>
        <h1 className="font-heading text-2xl font-black">Audit log</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={History} label="Entries" value={stats.totalEntries} />
        <StatCard
          icon={UserRoundCheck}
          label="Actors"
          value={stats.actorCount}
        />
        <StatCard
          icon={Fingerprint}
          label="Action types"
          value={stats.actionCount}
        />
        <StatCard icon={Clock3} label="Last 24 hours" value={stats.recentEntries} />
      </section>

      <AuditTable initialAuditLogs={auditLogs} />
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
  icon: typeof History;
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

function getAuditStats(auditLogs: AuditLogRow[]): AuditAdminStats {
  const since = Date.now() - 24 * 60 * 60 * 1_000;
  const actorIds = new Set(
    auditLogs
      .map((log) => log.actor?.id)
      .filter((actorId): actorId is string => typeof actorId === "string"),
  );
  const actions = new Set(auditLogs.map((log) => log.action));

  return {
    totalEntries: auditLogs.length,
    actorCount: actorIds.size,
    actionCount: actions.size,
    recentEntries: auditLogs.filter(
      (log) => new Date(log.createdAt).getTime() >= since,
    ).length,
  };
}
