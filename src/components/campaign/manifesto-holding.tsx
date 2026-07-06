import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/kicker";
import { GrainOverlay } from "@/components/ui/grain-overlay";

/**
 * Temporary holding state while Kirstin's Financial Officer manifesto is
 * being written. Keeps the /manifesto route and its links alive without
 * showing the prior Public Relations content under the new office. Swap the
 * route back to <ManifestoPage /> once the refreshed copy lands.
 */
export function ManifestoHolding() {
  return (
    <article>
      <section className="relative isolate overflow-hidden bg-navy-deep text-cream">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-5 z-10 border border-cream/12"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-7 py-20 sm:py-28 md:grid-cols-[0.78fr_1fr]">
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
            <Kicker onDark>Manifesto · Financial Officer</Kicker>
            <h1 className="mt-5 text-[clamp(2.4rem,5.4vw,4rem)] leading-[1.0] text-cream">
              A refreshed manifesto,{" "}
              <em className="italic text-gold-bright">on the way.</em>
            </h1>
            <p className="mt-7 max-w-md text-[15.5px] leading-[1.75] text-cream/70">
              Kirstin Austin Ankrah is preparing her vision for the office of
              Financial Officer — grounded in transparency and careful
              stewardship of every member&rsquo;s contribution. It will be
              published here shortly.
            </p>
            <div className="mt-8">
              <p className="font-heading text-lg text-cream">
                Kirstin Austin Ankrah
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-bright">
                Candidate · MELSSA · Accra Technical University
              </p>
            </div>
            <div className="mt-9">
              <Button asChild variant="gold" className="h-11 rounded-full px-6">
                <Link href="/">
                  Explore the portal
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
