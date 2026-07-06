import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const profileFieldLabel =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/50";
export const profileFieldControl =
  "mt-2 w-full border-0 bg-transparent p-0 text-[15px] text-foreground outline-none placeholder:text-foreground/35 disabled:text-foreground/45";

/** Editorial section wrapper: serif heading + description with an optional action. */
export function ProfileSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl leading-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Hairline-bordered container for grouped fields (borderless inputs inside). */
export function ProfilePanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border border-hairline bg-paper-2", className)}>
      {children}
    </div>
  );
}
