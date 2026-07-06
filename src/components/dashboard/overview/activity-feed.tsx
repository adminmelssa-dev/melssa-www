import { ArrowLink } from "@/components/ui/arrow-link";
import { activityEntries } from "@/components/dashboard/overview/overview-data";
import { cn } from "@/lib/utils";

export function ActivityFeed() {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl">Recent activity</h2>
        <ArrowLink href="/dashboard/announcements">View all</ArrowLink>
      </div>

      <div className="mt-5 border-t border-hairline">
        {activityEntries.map((entry) => (
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
                {entry.detail}.
              </p>
              <p className="mt-0.5 text-xs text-foreground/45">{entry.meta}</p>
            </div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-foreground/40">
              {entry.time}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
