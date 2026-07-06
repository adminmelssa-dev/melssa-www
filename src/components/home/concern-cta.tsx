import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/kicker";
import { Reveal } from "@/components/ui/reveal";

/** Closing dark band inviting anonymous concerns. */
export function ConcernCta() {
  return (
    <section className="relative isolate overflow-hidden bg-ink-deep text-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[22px] border border-cream/12"
      />
      <Reveal className="relative mx-auto max-w-2xl px-7 py-28 text-center">
        <Kicker onDark className="justify-center">
          Every voice, heard
        </Kicker>
        <h2 className="mt-6 text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.06] text-cream">
          Got a concern?
          <br />
          Tell us — <em className="italic text-gold-bright">anonymously.</em>
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-[16.5px] leading-relaxed text-cream/75">
          Submit feedback, suggestions or concerns in confidence. Executives
          respond through the dashboard, and you can follow it to a reply without
          ever revealing your identity.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3.5">
          <Button asChild variant="gold" className="h-11 rounded-full px-6">
            <Link href="/concerns">
              Submit a concern
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-cream/30 bg-transparent px-6 text-cream hover:bg-cream hover:text-ink-deep"
          >
            <Link href="/concerns">How it works</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
