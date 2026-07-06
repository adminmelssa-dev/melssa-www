import { SectionHeading } from "@/components/home/section-heading";
import { SectionEmpty } from "@/components/home/section-empty";

/** Student spotlight — empty until members are featured. */
export function StudentSpotlight() {
  return (
    <section className="bg-paper-2 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-7">
        <SectionHeading
          kicker="Student Spotlight"
          title="Celebrating our members."
          action={{ label: "View spotlight", href: "/spotlight" }}
        />
        <SectionEmpty message="Featured student stories will appear here soon." />
      </div>
    </section>
  );
}
