import type { ReactNode } from "react";
import { Kicker } from "@/components/ui/kicker";

interface PublicPageHeaderProps {
  kicker: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

/** Editorial header for public pages: kicker + large serif title + deck, with a hairline. */
export function PublicPageHeader({
  kicker,
  title,
  description,
  actions,
}: PublicPageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-hairline pb-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <Kicker>{kicker}</Kicker>
        <h1 className="mt-4 text-[clamp(2.2rem,4vw,3.25rem)] leading-[1.02]">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-foreground/65">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      ) : null}
    </header>
  );
}
