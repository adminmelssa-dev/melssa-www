import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

/** Editorial empty state — a gold-ringed icon, serif title and quiet note between hairlines. */
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center border-y border-hairline py-20 text-center">
      <span className="grid size-12 place-items-center rounded-full border border-gold/60 text-gold-ink">
        <Icon className="size-5" />
      </span>
      <h2 className="mt-5 text-2xl">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
