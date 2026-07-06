import { Reveal } from "@/components/ui/reveal";

export function IntroStatement() {
  return (
    <section className="border-b border-hairline py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-7">
        <Reveal className="grid gap-14 md:grid-cols-[1fr_0.82fr] md:gap-16">
          <p className="font-heading text-[clamp(1.6rem,2.6vw,2.35rem)] leading-[1.28]">
            From your first lecture to final revision —{" "}
            <span className="[background:linear-gradient(transparent_66%,var(--gold-soft)_0)] px-0.5">
              the slides you missed, the papers you&rsquo;re studying, and every
              update worth knowing.
            </span>
          </p>
          <div className="space-y-4 text-[15px] leading-[1.8] text-foreground/70">
            <p>
              Stay ahead with announcements and events. Find your lecturers&rsquo;
              contacts and office hours. Share a concern in confidence, and follow
              it to a reply.
            </p>
            <p>Organised around your level, your courses, and your semester.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
