import { SectionHeading } from "@/components/home/section-heading";
import { SectionEmpty } from "@/components/home/section-empty";

/** Recent uploads — empty until resources are published. */
export function RecentUploads() {
  return (
    <section className="py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-7">
        <SectionHeading
          kicker="Fresh in the library"
          title="Recently added."
          action={{ label: "Browse the archive", href: "/resources" }}
        />
        <SectionEmpty message="Newly uploaded slides and past questions will appear here soon." />
      </div>
    </section>
  );
}
