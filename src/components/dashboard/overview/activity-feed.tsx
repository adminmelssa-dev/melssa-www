import { ArrowLink } from "@/components/ui/arrow-link";
import { OverviewEmpty } from "@/components/dashboard/overview/overview-empty";
import type { ActivityEntry } from "@/components/dashboard/overview/overview-data";
import { cn } from "@/lib/utils";

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl">Recent activity</h2>
        {entries.length > 0 ? (
          <ArrowLink href="/dashboard/audit">View all</ArrowLink>
        ) : null}
      </div>

      {entries.length > 0 ? (
        <div className="mt-5 border-t border-hairline">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[auto_1fr_auto] items-baseline gap-4 border-b border-hairline py-4"
            >
              <span
                aria-hidden
                className={cn(
                  "size-[7px] translate-y-1.5 rounded-full",
                  entry.tone === "success" ? "bg-success" : "bg-gold",
                )}
              />
              <div>
                <p className="text-sm leading-relaxed text-foreground/80">
                  <span className="font-semibold text-foreground">
                    {entry.subject}
                  </span>{" "}
                  {entry.detail}
                </p>
                {entry.meta ? (
                  <p className="mt-0.5 text-xs text-foreground/45">{entry.meta}</p>
                ) : null}
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wide text-foreground/40">
                {entry.time}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <OverviewEmpty message="No recent activity yet." />
      )}
    </section>
  );
}
