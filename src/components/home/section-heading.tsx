import type { ReactNode } from "react";
import { Kicker } from "@/components/ui/kicker";
import { ArrowLink } from "@/components/ui/arrow-link";

interface SectionHeadingProps {
  kicker: string;
  title: ReactNode;
  /** Editorial deck shown to the right on wide screens. */
  deck?: ReactNode;
  /** Tertiary "view all" style link, shown to the right. */
  action?: { label: string; href: string };
}

/** Kicker + serif title, with an optional deck or action aligned to the baseline. */
export function SectionHeading({
  kicker,
  title,
  deck,
  action,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <Kicker>{kicker}</Kicker>
        <h2 className="mt-5 text-[clamp(1.9rem,3.4vw,3rem)] leading-[1.03]">
          {title}
        </h2>
      </div>
      {deck ? (
        <p className="max-w-md text-[15px] leading-relaxed text-foreground/65">
          {deck}
        </p>
      ) : null}
      {action ? <ArrowLink href={action.href}>{action.label}</ArrowLink> : null}
    </div>
  );
}
