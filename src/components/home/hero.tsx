import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/kicker";
import { Reveal } from "@/components/ui/reveal";
import { heroImages } from "@/components/home/content";

// Duplicated once so the marquee track loops seamlessly at translateX(-50%).
const marqueeTiles = [...heroImages, ...heroImages];

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[min(90vh,900px)] items-center justify-center overflow-hidden bg-navy-deep text-cream">
      <div
        aria-hidden
        className="absolute inset-0 z-0 flex w-max animate-marquee items-center [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)] [-webkit-mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)] hover:[animation-play-state:paused]"
      >
        {marqueeTiles.map((image, index) => (
          <div
            key={`${image.src}-${index}`}
            className="relative mr-3.5 h-[74%] w-[clamp(210px,23vw,330px)] shrink-0 overflow-hidden rounded-[3px]"
          >
            <Image
              src={image.src}
              alt=""
              fill
              sizes="330px"
              className="object-cover brightness-[0.94] saturate-[0.9]"
            />
          </div>
        ))}
      </div>

      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(9,24,49,0.72),rgba(9,24,49,0.62)_42%,rgba(9,24,49,0.93)),radial-gradient(ellipse_60%_72%_at_50%_46%,rgba(9,24,49,0.4),rgba(9,24,49,0.86))]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[22px] z-[2] border border-cream/15"
      />

      <Reveal className="relative z-[3] w-full max-w-[900px] px-7 py-[72px] text-center">
        <Kicker onDark className="justify-center">
          MELSSA &middot; Accra Technical University
        </Kicker>
        <h1 className="mt-7 text-[clamp(2.5rem,6vw,5rem)] leading-[1.02] tracking-[-0.012em] text-cream [text-shadow:0_2px_44px_rgba(9,24,49,0.55)]">
          Everything you need
          <br />
          to <em className="italic text-gold-bright">thrive</em> at MELSSA.
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-cream/85 [text-shadow:0_1px_22px_rgba(9,24,49,0.6)]">
          The slides you missed, the papers you&rsquo;re studying, and every update
          worth knowing — for every member, in one place.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3.5">
          <Button asChild variant="gold" className="h-11 rounded-full px-6">
            <Link href="/resources">
              Browse resources
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-cream/30 bg-transparent px-6 text-cream hover:bg-cream hover:text-navy-deep"
          >
            <Link href="/announcements">See what&rsquo;s new</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
