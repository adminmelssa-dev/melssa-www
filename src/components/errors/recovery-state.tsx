"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Atom,
  Home,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RecoveryStateVariant = "standalone" | "section" | "compact";

interface RecoveryStateProps {
  description: string;
  eyebrow: string;
  homeHref?: string;
  homeLabel?: string;
  onReset?: () => void;
  resetLabel?: string;
  title: string;
  variant?: RecoveryStateVariant;
}

export function RecoveryState({
  description,
  eyebrow,
  homeHref = "/",
  homeLabel = "Go home",
  onReset,
  resetLabel = "Try again",
  title,
  variant = "section",
}: RecoveryStateProps) {
  const isStandalone = variant === "standalone";
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-background",
        isStandalone
          ? "grid min-h-screen place-items-center px-6 py-12"
          : "mx-auto w-full max-w-5xl px-0 py-12",
        isCompact ? "py-6" : "",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-hairline",
          isStandalone ? "top-8" : "",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-hairline",
          isStandalone ? "bottom-8" : "",
        )}
      />

      <section
        className={cn(
          "relative w-full text-center",
          isStandalone ? "max-w-2xl" : "mx-auto max-w-2xl",
        )}
      >
        <div className="mx-auto grid size-16 place-items-center rounded-full border border-gold/60 bg-paper-2 shadow-sm">
          <Atom className="size-8 text-gold-ink" />
        </div>

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-ink">
          {eyebrow}
        </p>
        <h1
          className={cn(
            "mx-auto mt-3 max-w-2xl",
            isCompact
              ? "text-3xl sm:text-4xl"
              : "text-4xl sm:text-5xl lg:text-6xl",
          )}
        >
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
          {description}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {onReset ? (
            <Button
              className="rounded-full px-5"
              onClick={onReset}
              type="button"
              variant="gold"
            >
              <RefreshCw className="size-4" />
              {resetLabel}
            </Button>
          ) : null}
          <Button asChild className="rounded-full px-5" variant="outline">
            <Link href={homeHref}>
              {homeHref === "/" ? (
                <Home className="size-4" />
              ) : (
                <ArrowLeft className="size-4" />
              )}
              {homeLabel}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
