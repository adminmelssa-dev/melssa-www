import Link from "next/link";
import { Atom } from "lucide-react";
import { cn } from "@/lib/utils";

interface MelssaWordmarkProps {
  href?: string;
  subtitle?: string;
  /** Render for placement on a dark (navy) surface. */
  onDark?: boolean;
  className?: string;
  /** Extra classes for the subtitle line — e.g. to hide it on small screens. */
  subtitleClassName?: string;
}

/** MELSSA lockup: a gold-ringed crest mark beside the serif wordmark. */
export function MelssaWordmark({
  href = "/",
  subtitle = "Accra Technical University",
  onDark = false,
  className,
  subtitleClassName,
}: MelssaWordmarkProps) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-3", className)}
    >
      <span className="relative grid size-10 shrink-0 place-items-center rounded-full border border-gold/70">
        <span
          aria-hidden
          className={cn(
            "absolute inset-[3px] rounded-full border",
            onDark ? "border-cream/20" : "border-border",
          )}
        />
        <Atom className="relative size-[22px] text-gold-ink" />
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block font-heading text-[1.35rem] tracking-[0.06em]",
            onDark ? "text-cream" : "text-foreground",
          )}
        >
          MELSSA
        </span>
        <span
          className={cn(
            "mt-1 block text-[0.6rem] font-medium uppercase tracking-[0.22em] text-gold-ink",
            subtitleClassName,
          )}
        >
          {subtitle}
        </span>
      </span>
    </Link>
  );
}
