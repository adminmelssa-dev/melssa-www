import {
  Archive,
  FileText,
  Send,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SpotlightsTable } from "@/modules/spotlights/components/spotlights-table";
import type { SpotlightRow } from "@/modules/spotlights/contracts";
import { getSerializedSpotlights } from "@/modules/spotlights/queries";
import { requirePermission } from "@/server/auth/guards";

interface SpotlightsAdminStats {
  totalSpotlights: number;
  publishedSpotlights: number;
  draftSpotlights: number;
  archivedSpotlights: number;
}

export async function SpotlightsAdminPage() {
  const session = await requirePermission({
    resource: "spotlight",
    action: "read",
  });
  const spotlights = await getSerializedSpotlights();
  const stats = getSpotlightsAdminStats(spotlights);
  const permissions = {
    canCreate: session.permissions.has({
      resource: "spotlight",
      action: "create",
    }),
    canUpdate: session.permissions.has({
      resource: "spotlight",
      action: "update",
    }),
    canDelete: session.permissions.has({
      resource: "spotlight",
      action: "delete",
    }),
    canPublish: session.permissions.has({
      resource: "spotlight",
      action: "publish",
    }),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Student stories</p>
        <h1 className="font-heading text-2xl font-black">Spotlight</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Sparkles}
          label="Spotlights"
          value={stats.totalSpotlights}
        />
        <StatCard
          icon={Send}
          label="Published"
          value={stats.publishedSpotlights}
        />
        <StatCard icon={FileText} label="Drafts" value={stats.draftSpotlights} />
        <StatCard
          icon={Archive}
          label="Archived"
          value={stats.archivedSpotlights}
        />
      </section>

      <SpotlightsTable
        initialSpotlights={spotlights}
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
  icon: typeof Sparkles;
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

function getSpotlightsAdminStats(
  spotlights: SpotlightRow[],
): SpotlightsAdminStats {
  return {
    totalSpotlights: spotlights.length,
    publishedSpotlights: spotlights.filter(
      (spotlight) => spotlight.status === "published",
    ).length,
    draftSpotlights: spotlights.filter((spotlight) => spotlight.status === "draft")
      .length,
    archivedSpotlights: spotlights.filter(
      (spotlight) => spotlight.status === "archived",
    ).length,
  };
}
