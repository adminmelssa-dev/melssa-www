import { StatTile } from "@/components/dashboard/stat-tile";
import type { KpiStat } from "@/components/dashboard/overview/overview-data";

export function KpiRow({ stats }: { stats: KpiStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-8 border-y border-hairline py-8 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-hairline">
      {stats.map((stat) => (
        <div key={stat.label} className="lg:px-8 lg:first:pl-0 lg:last:pr-0">
          <StatTile
            label={stat.label}
            value={stat.value}
            delta={stat.delta}
            tone={stat.tone}
          />
        </div>
      ))}
    </div>
  );
}
