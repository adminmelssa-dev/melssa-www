"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownProps {
  /** ISO date string of the event. */
  target: string;
  className?: string;
}

function daysUntil(target: string): number {
  const ms = new Date(target).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/**
 * Live "days away" indicator for an upcoming event. Renders nothing until mounted
 * so the client-computed value never mismatches the server render.
 */
export function Countdown({ target, className }: CountdownProps) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setDays(daysUntil(target));
    update();
    const id = window.setInterval(update, 3_600_000);
    return () => window.clearInterval(id);
  }, [target]);

  return (
    <span
      className={cn(
        "text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gold-ink",
        className,
      )}
    >
      {days === null ? (
        <span aria-hidden>&nbsp;</span>
      ) : days === 0 ? (
        "Today"
      ) : (
        <>
          <span className="mr-1.5 font-heading text-[1.4rem] tracking-normal text-foreground">
            {days}
          </span>
          {days === 1 ? "day away" : "days away"}
        </>
      )}
    </span>
  );
}
