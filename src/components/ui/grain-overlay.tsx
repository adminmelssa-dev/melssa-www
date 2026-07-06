import { cn } from "@/lib/utils";

// Inline fractal-noise SVG — a faint film grain for an editorial print feel.
const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Subtle grain texture layer. Place inside a `relative` container. */
export function GrainOverlay({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      style={{ backgroundImage: GRAIN_URL }}
      className={cn(
        "pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay",
        className,
      )}
    />
  );
}
