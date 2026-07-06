import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OverviewEmpty } from "@/components/dashboard/overview/overview-empty";
import type { PendingConcern } from "@/components/dashboard/overview/overview-data";

export function PendingConcerns({ concerns }: { concerns: PendingConcern[] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl">Pending concerns</h2>
        {concerns.length > 0 ? (
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-destructive">
            {concerns.length} open
          </span>
        ) : null}
      </div>

      {concerns.length > 0 ? (
        <div className="mt-5 border-t border-hairline">
          {concerns.map((concern) => (
            <Link
              key={concern.id}
              href="/dashboard/concerns"
              className="group flex items-center gap-3 border-b border-hairline py-3.5 transition-[padding] duration-300 ease-editorial hover:pl-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {concern.title}
                </div>
                <div className="text-xs text-muted-foreground">{concern.meta}</div>
              </div>
              <ArrowRight className="size-4 shrink-0 text-foreground/35 transition-transform duration-300 ease-editorial group-hover:translate-x-1 group-hover:text-gold-ink" />
            </Link>
          ))}
        </div>
      ) : (
        <OverviewEmpty message="No open concerns." />
      )}
    </section>
  );
}
