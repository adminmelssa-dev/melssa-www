import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KickerProps {
  children: ReactNode;
  /** Render for placement on a dark (navy) surface. */
  onDark?: boolean;
  className?: string;
}

/**
 * Editorial eyebrow: a short accent rule followed by a wide-tracked uppercase label.
 * Sets section context with restraint.
 */
export function Kicker({ children, onDark = false, className }: KickerProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.24em]",
        onDark ? "text-gold-bright" : "text-gold-ink",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("h-px w-6", onDark ? "bg-gold-bright" : "bg-gold")}
      />
      {children}
    </span>
  );
}
