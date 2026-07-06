import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ArrowLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/** Tertiary text link with an arrow that nudges on hover. */
export function ArrowLink({ href, children, className }: ArrowLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-gold-ink",
        className,
      )}
    >
      {children}
      <ArrowRight className="size-3.5 transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
    </Link>
  );
}
