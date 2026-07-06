import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/home/section-heading";
import { exploreItems } from "@/components/home/content";

/** Editorial index list — numbered, hairline-separated portal sections. */
export function ExploreIndex() {
  return (
    <section className="bg-paper-2 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-7">
        <SectionHeading
          kicker="Explore"
          title="Find what you need."
          action={{ label: "View everything", href: "/resources" }}
        />

        <Reveal className="mt-14 border-t border-hairline">
          {exploreItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-6 border-b border-hairline py-7 transition-[padding] duration-300 ease-editorial hover:pl-5 sm:grid-cols-[3.5rem_1fr_auto] sm:gap-7"
            >
              <span className="font-heading text-xl text-foreground/40 transition-colors group-hover:text-gold-ink">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block font-heading text-[1.45rem] leading-tight transition-colors group-hover:text-gold-ink sm:text-[1.6rem]">
                  {item.title}
                </span>
                <span className="mt-1.5 block text-sm text-foreground/60">
                  {item.description}
                </span>
              </span>
              <ArrowRight className="size-[18px] text-foreground/35 transition-all duration-300 ease-editorial group-hover:translate-x-1.5 group-hover:text-gold-ink" />
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
