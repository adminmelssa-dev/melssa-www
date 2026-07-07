"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  EyeOff,
  MessageCircleReply,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/kicker";
import { cn } from "@/lib/utils";

const SUBMIT_HREF = "/concerns";

interface Slide {
  kicker: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

function AssuranceTrio() {
  const items = [
    { icon: EyeOff, title: "Anonymous", detail: "It never asks for your identity." },
    { icon: ShieldCheck, title: "No login", detail: "Submit without an account." },
    {
      icon: MessageCircleReply,
      title: "Tracked",
      detail: "Executives respond and resolve.",
    },
  ];
  return (
    <div className="mx-auto grid max-w-md gap-px overflow-hidden rounded-md border border-hairline bg-hairline sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.title} className="bg-background p-5">
          <item.icon className="size-5 text-gold-ink" />
          <div className="mt-3 text-sm font-semibold text-foreground">
            {item.title}
          </div>
          <div className="mt-0.5 text-[12.5px] leading-relaxed text-foreground/55">
            {item.detail}
          </div>
        </div>
      ))}
    </div>
  );
}

function FormPreview() {
  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-md border border-hairline bg-paper-2">
      <div className="border-b border-hairline p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/50">
          Category
        </div>
        <div className="mt-2 inline-flex rounded border border-hairline px-2 py-0.5 text-[12px] font-medium text-foreground/70">
          Academics
        </div>
      </div>
      <div className="border-b border-hairline p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/50">
          Subject
        </div>
        <div className="mt-1.5 text-sm text-foreground/70">
          Lab session scheduling clash
        </div>
      </div>
      <div className="p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/50">
          Details
        </div>
        <div className="mt-1.5 text-sm italic text-foreground/40">
          Describe the concern clearly…
        </div>
      </div>
    </div>
  );
}

function StepFlow() {
  const steps = ["Submit", "Reviewed", "Actioned", "Resolved"];
  return (
    <div className="mx-auto flex max-w-md items-start justify-between">
      {steps.map((label, index) => {
        const last = index === steps.length - 1;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "grid size-11 place-items-center rounded-full",
                  last
                    ? "bg-gold text-gold-foreground"
                    : "bg-navy-deep text-cream",
                )}
              >
                <span className="font-heading text-[15px]">{index + 1}</span>
              </div>
              <span className="text-[11px] font-medium text-foreground">
                {label}
              </span>
            </div>
            {!last ? (
              <div className="mt-5 h-px flex-1 bg-hairline" />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PrivacyPoints() {
  const points = [
    "No name, email, or login is ever requested.",
    "Submissions can't be traced back to you.",
    "A security check protects the form from abuse.",
  ];
  return (
    <ul className="mx-auto max-w-md space-y-3">
      {points.map((point) => (
        <li
          key={point}
          className="flex items-start gap-3 rounded-md border border-hairline p-3.5"
        >
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-ink">
            <Check className="size-3.5" />
          </span>
          <span className="text-sm leading-relaxed text-foreground/75">
            {point}
          </span>
        </li>
      ))}
    </ul>
  );
}

const SLIDES: Slide[] = [
  {
    kicker: "Student support",
    title: "A private channel to be heard.",
    description:
      "Raise any academic, welfare, finance, facilities or safety concern with MELSSA leadership — without ever giving your name.",
    content: <AssuranceTrio />,
  },
  {
    kicker: "Step one",
    title: "Share your concern.",
    description:
      "Pick a category, add a short subject, and describe what's happening. Include as much or as little as you like.",
    content: <FormPreview />,
  },
  {
    kicker: "Step two",
    title: "What happens next.",
    description:
      "Your concern reaches the executive team. They review it, take action, and mark it resolved.",
    content: <StepFlow />,
  },
  {
    kicker: "Your privacy",
    title: "Anonymous, always.",
    description:
      "The form is built so a concern can never be linked back to you.",
    content: <PrivacyPoints />,
  },
];

interface ConcernTutorialProps {
  triggerClassName?: string;
  triggerLabel?: string;
  triggerIcon?: React.ReactNode;
}

export function ConcernTutorial({
  triggerClassName,
  triggerLabel = "How it works",
  triggerIcon,
}: ConcernTutorialProps) {
  const [open, setOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setSlideIndex(0);
  }, []);

  const isLast = slideIndex === SLIDES.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      close();
      router.push(SUBMIT_HREF);
    } else {
      setSlideIndex((value) => value + 1);
    }
  }, [isLast, close, router]);

  const goBack = useCallback(() => {
    setSlideIndex((value) => Math.max(0, value - 1));
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goBack();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, close, goNext, goBack]);

  const slide = SLIDES[slideIndex];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {triggerIcon}
        {triggerLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-navy-deep/70 backdrop-blur-sm"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="How concerns work"
            className="relative z-10 mx-4 flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-hairline bg-background text-foreground shadow-2xl"
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-paper-3 px-3 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:text-foreground"
            >
              Skip
              <X className="size-3" />
            </button>

            <div className="flex-1 overflow-auto px-8 pb-6 pt-14 sm:px-12 sm:pt-16">
              <div className="mb-8 text-center">
                <div className="flex justify-center">
                  <Kicker>{slide.kicker}</Kicker>
                </div>
                <h2 className="mt-4 text-[clamp(1.6rem,2.6vw,2.1rem)] leading-tight">
                  {slide.title}
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-foreground/65">
                  {slide.description}
                </p>
              </div>
              {slide.content}
            </div>

            <div className="flex items-center justify-between border-t border-hairline px-8 py-4 sm:px-12">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                disabled={slideIndex === 0}
                className="rounded-full"
              >
                <ArrowLeft className="size-3.5" />
                Back
              </Button>

              <div className="flex gap-2">
                {SLIDES.map((entry, index) => (
                  <button
                    key={entry.title}
                    type="button"
                    onClick={() => setSlideIndex(index)}
                    aria-label={`Go to step ${index + 1}`}
                    className={cn(
                      "size-2 rounded-full transition-all",
                      index === slideIndex
                        ? "scale-125 bg-gold"
                        : index < slideIndex
                          ? "bg-gold/40"
                          : "bg-hairline",
                    )}
                  />
                ))}
              </div>

              <Button
                variant="gold"
                size="sm"
                onClick={goNext}
                className="rounded-full"
              >
                {isLast ? "Submit a concern" : "Next"}
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
