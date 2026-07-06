import type { ReactNode } from "react";
import { Kicker } from "@/components/ui/kicker";

interface DashboardPageHeaderProps {
  title: string;
  kicker?: string;
  description?: string;
  actions?: ReactNode;
}

/** Shared editorial page header for dashboard routes: kicker + serif title + actions. */
export function DashboardPageHeader({
  title,
  kicker,
  description,
  actions,
}: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-hairline pb-7 md:flex-row md:items-end md:justify-between">
      <div>
        {kicker ? <Kicker>{kicker}</Kicker> : null}
        <h1 className="mt-3 text-[clamp(1.8rem,3vw,2.25rem)] leading-none">
          {title}
        </h1>
        {description ? (
          <p className="mt-2.5 max-w-prose text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      ) : null}
    </div>
  );
}
