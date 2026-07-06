import { SectionHeading } from "@/components/home/section-heading";
import { SectionEmpty } from "@/components/home/section-empty";

/** Upcoming events — empty until events are scheduled. */
export function UpcomingEvents() {
  return (
    <section className="bg-paper-3 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-7">
        <SectionHeading
          kicker="Mark your calendar"
          title="Upcoming events."
          action={{ label: "Full calendar", href: "/events" }}
        />
        <SectionEmpty message="Upcoming MELSSA events will appear here soon." />
      </div>
    </section>
  );
}
