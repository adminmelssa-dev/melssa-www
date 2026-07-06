import { SectionHeading } from "@/components/home/section-heading";
import { SectionEmpty } from "@/components/home/section-empty";

/** Latest announcements — empty until content is published. */
export function LatestAnnouncements() {
  return (
    <section className="py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-7">
        <SectionHeading
          kicker="Stay informed"
          title={
            <>
              The latest from
              <br />
              the association.
            </>
          }
          deck="Fresh announcements, opportunities and notices — published straight to the portal so nothing important is missed."
        />
        <SectionEmpty message="Published announcements will appear here soon." />
      </div>
    </section>
  );
}
