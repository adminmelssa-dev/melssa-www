import { cn } from "@/lib/utils";

export type StatTone = "neutral" | "up" | "warn";

interface StatTileProps {
  label: string;
  value: string;
  delta?: string;
  tone?: StatTone;
}

const toneStyles: Record<StatTone, string> = {
  neutral: "text-foreground/55",
  up: "text-success",
  warn: "text-destructive",
};

/** Oversized serif KPI figure with a label and optional delta. */
export function StatTile({ label, value, delta, tone = "neutral" }: StatTileProps) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/50">
        {label}
      </div>
      <div className="mt-3 font-heading text-[clamp(2.75rem,4vw,3.25rem)] leading-[0.9]">
        {value}
      </div>
      {delta ? (
        <div className={cn("mt-3 text-[12.5px]", toneStyles[tone])}>{delta}</div>
      ) : null}
    </div>
  );
}
