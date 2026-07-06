"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { Award, Check, Vote } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/kicker";
import { GrainOverlay } from "@/components/ui/grain-overlay";

const SEEN_KEY = "melssa:campaign-seen";
const AUTO_OPEN_DELAY_MS = 4500;
const CANDIDATE_PHOTO = "/kirstin.jpg";

const pillars = [
  "Timely, effective communication",
  "A modern digital home for MELSSA",
  "Every voice engaged & represented",
];

// Staggered rise-in for the copy, so the modal doesn't feel abrupt.
function rise(delayMs: number): CSSProperties {
  return {
    animationName: "rise-in",
    animationDuration: "0.55s",
    animationTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
    animationFillMode: "both",
    animationDelay: `${delayMs}ms`,
  };
}

export function CampaignPromo() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SEEN_KEY)) return;
    // Don't auto-pop over the manifesto page itself — they're already reading it.
    if (window.location.pathname === "/manifesto") return;
    const id = window.setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(SEEN_KEY, "1");
    }, AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="A note from the campaign"
        className="group animate-campaign-glow fixed right-5 bottom-5 z-40 flex h-12 items-center rounded-full bg-gold px-3.5 text-gold-foreground transition-transform hover:scale-[1.03] motion-reduce:animate-none sm:right-6 sm:bottom-6"
      >
        <Award className="size-5 shrink-0" />
        <span className="grid grid-cols-[0fr] transition-all duration-300 ease-editorial group-hover:grid-cols-[1fr] group-hover:pl-2">
          <span className="overflow-hidden whitespace-nowrap text-[13.5px] font-semibold">
            Vote Kirstin
          </span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden border-hairline p-0 duration-500 sm:max-w-4xl">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-3.5 z-20 rounded-sm border border-gold/25"
          />

          <div className="grid sm:grid-cols-[0.85fr_1fr]">
            {/* Portrait with name-plate */}
            <div className="relative h-60 overflow-hidden bg-navy-deep sm:h-auto sm:min-h-[560px]">
              <Image
                src={CANDIDATE_PHOTO}
                alt="Kirstin Austin Ankrah"
                fill
                sizes="(min-width: 640px) 420px, 100vw"
                className="object-cover object-[50%_28%] sm:object-[50%_12%]"
              />
              <GrainOverlay />
              <Award
                aria-hidden
                className="pointer-events-none absolute -bottom-4 -left-8 size-44 -rotate-[8deg] text-gold-bright/[0.08]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-deep via-navy-deep/70 to-transparent px-7 pt-20 pb-7">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-gold-bright">
                  Candidate · Financial Officer
                </div>
                <div className="mt-1.5 font-heading text-[1.7rem] leading-tight text-cream">
                  Kirstin Austin Ankrah
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="flex flex-col justify-center p-9 sm:p-11">
              <div style={rise(80)}>
                <Kicker>Under construction</Kicker>
              </div>
              <DialogTitle
                style={rise(160)}
                className="mt-4 text-[clamp(1.7rem,2.6vw,2.3rem)] leading-[1.08]"
              >
                Help see this vision through.
              </DialogTitle>
              <DialogDescription
                style={rise(240)}
                className="mt-4 text-[15px] leading-relaxed text-foreground/70"
              >
                This portal is being built for the whole of MELSSA — and it&rsquo;s
                still a work in progress. A vote for{" "}
                <strong className="font-semibold text-foreground">
                  Kirstin Austin Ankrah
                </strong>{" "}
                as Financial Officer helps carry it to completion.
              </DialogDescription>

              <ul style={rise(340)} className="mt-7 space-y-2.5">
                {pillars.map((pillar) => (
                  <li key={pillar} className="flex items-center gap-3 text-sm">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-ink">
                      <Check className="size-3" />
                    </span>
                    <span className="text-foreground/80">{pillar}</span>
                  </li>
                ))}
              </ul>

              <div
                style={rise(440)}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <Button asChild variant="gold" className="rounded-full">
                  <Link href="/manifesto" onClick={() => setOpen(false)}>
                    <Vote className="size-4" />
                    Vote Kirstin Austin Ankrah
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setOpen(false)}
                >
                  Keep exploring
                </Button>
              </div>

              <p
                style={rise(540)}
                className="mt-8 font-heading text-sm italic text-gold-ink"
              >
                Every Voice Informed. Every Voice Represented.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
