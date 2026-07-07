import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/kicker";
import { Reveal } from "@/components/ui/reveal";
import { GrainOverlay } from "@/components/ui/grain-overlay";
import {
  commitments,
  manifestoIntro,
  pillars,
} from "@/components/campaign/manifesto-content";

export function ManifestoPage() {
  return (
    <article>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy-deep text-cream">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-5 z-10 border border-cream/12"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-7 py-16 sm:py-20 md:grid-cols-[0.78fr_1fr]">
          <div className="relative mx-auto aspect-4/5 w-full max-w-xs overflow-hidden border border-cream/15 md:max-w-sm">
            <Image
              src="/kirstin.jpg"
              alt="Kirstin Austin Ankrah"
              fill
              sizes="(min-width: 768px) 24rem, 20rem"
              className="object-cover object-[50%_12%]"
              priority
            />
            <GrainOverlay />
          </div>
          <div>
            <Kicker onDark>{manifestoIntro.eyebrow}</Kicker>
            <h1 className="mt-5 text-[clamp(2.6rem,6vw,4.5rem)] leading-[0.98] text-cream">
              Every Cedi,{" "}
              <em className="italic text-gold-bright">Accounted For.</em>
            </h1>
            <p className="mt-6 font-heading text-xl text-cream">
              {manifestoIntro.candidate}
            </p>
            <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-bright">
              {manifestoIntro.affiliation}
            </p>
          </div>
        </div>
      </section>

      {/* Intro statement */}
      <section className="border-b border-hairline py-20">
        <div className="mx-auto max-w-6xl px-7">
          <Reveal className="grid gap-12 md:grid-cols-[1fr_0.78fr]">
            <p className="font-heading text-[clamp(1.5rem,2.4vw,2.2rem)] leading-[1.3]">
              {manifestoIntro.lead}
            </p>
            <div className="space-y-4 text-[15px] leading-relaxed text-foreground/70 md:pt-2">
              <p>{manifestoIntro.body}</p>
              <p className="font-medium text-foreground">
                My vision is centred on four pillars.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-7">
          <Reveal>
            <Kicker>The Vision</Kicker>
            <h2 className="mt-4 text-[clamp(2rem,3.4vw,3rem)] leading-[1.02]">
              Four pillars.
            </h2>
          </Reveal>

          <div className="mt-12 border-t border-hairline">
            {pillars.map((pillar, index) => (
              <Reveal key={pillar.title}>
                <div className="grid gap-6 border-b border-hairline py-12 md:grid-cols-[auto_1fr] md:gap-12">
                  <div className="font-heading text-3xl tabular-nums text-gold-ink">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="grid gap-8 md:grid-cols-[1fr_0.9fr] md:gap-12">
                    <div>
                      <h3 className="text-[clamp(1.5rem,2.4vw,2rem)] leading-tight">
                        {pillar.title}
                      </h3>
                      <p className="mt-4 max-w-md text-[15.5px] leading-[1.7] text-foreground/70">
                        {pillar.summary}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-ink">
                        In practice
                      </p>
                      <ul className="mt-2">
                        {pillar.practice.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-3 border-t border-hairline py-3.5 text-sm leading-relaxed text-foreground/80"
                          >
                            <span
                              aria-hidden
                              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Commitment */}
      <section className="border-t border-hairline bg-paper-2 py-20">
        <div className="mx-auto max-w-6xl px-7">
          <Reveal>
            <Kicker>My commitment</Kicker>
            <h2 className="mt-4 max-w-2xl text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.05]">
              If entrusted, I pledge to serve with:
            </h2>
          </Reveal>
          <Reveal className="mt-10 grid gap-px overflow-hidden border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-5">
            {commitments.map((commitment, index) => (
              <div key={commitment} className="bg-paper-2 p-6">
                <div className="font-heading text-2xl text-gold-ink">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                  {commitment}
                </p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative isolate overflow-hidden bg-ink-deep text-cream">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-5 border border-cream/12"
        />
        <div className="mx-auto max-w-2xl px-7 py-24 text-center">
          <h2 className="text-[clamp(2rem,3.6vw,3.2rem)] leading-[1.08] text-cream">
            Every Cedi Accounted For.
            <br />
            <em className="italic text-gold-bright">Every Member Informed.</em>
          </h2>
          <p className="mt-6 text-[15px] text-cream/70">
            Vote Kirstin Austin Ankrah for Financial Officer.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild variant="gold" className="h-11 rounded-full px-6">
              <Link href="/">
                Explore the portal
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </article>
  );
}
