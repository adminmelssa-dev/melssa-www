import Image from "next/image";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getSerializedPublishedEvents } from "@/modules/events/queries";

const monthFormatter = new Intl.DateTimeFormat("en", { month: "short" });
const timeFormatter = new Intl.DateTimeFormat("en", {
  hour: "numeric",
  minute: "2-digit",
});
const dateFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "long",
  day: "numeric",
  year: "numeric",
});

export async function EventsPublicPage() {
  const events = await getSerializedPublishedEvents();

  return (
    <div className="mx-auto max-w-6xl px-7 py-16">
      <PublicPageHeader
        kicker="Programs & activities"
        title="Events"
        description="Congress, health outreach, seminars and screenings — mark your calendar."
      />

      {events.length > 0 ? (
        <div className="mt-6 max-w-3xl border-t border-hairline">
          {events.map((event) => {
            const start = new Date(event.startsAt);
            return (
              <article
                key={event.id}
                className="grid gap-6 border-b border-hairline py-10 sm:grid-cols-[5rem_1fr] sm:gap-9"
              >
                <div className="flex items-baseline gap-2.5 sm:flex-col sm:items-start sm:gap-1">
                  <span className="font-heading text-[2.75rem] leading-[0.8]">
                    {start.getDate()}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">
                    {monthFormatter.format(start)}
                  </span>
                </div>

                <div>
                  <h2 className="text-[clamp(1.5rem,2.4vw,2rem)] leading-tight">
                    {event.title}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-foreground/60">
                    <span className="inline-flex items-center gap-2">
                      <Clock className="size-4" />
                      {dateFormatter.format(start)} · {timeFormatter.format(start)}
                      {event.endsAt
                        ? ` – ${timeFormatter.format(new Date(event.endsAt))}`
                        : ""}
                    </span>
                    {event.location ? (
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="size-4" />
                        {event.location}
                      </span>
                    ) : null}
                  </div>
                  {event.description ? (
                    <p className="mt-4 whitespace-pre-line text-[15px] leading-[1.75] text-foreground/80">
                      {event.description}
                    </p>
                  ) : null}
                  {event.poster ? (
                    <div className="relative mt-6 aspect-[16/9] max-w-2xl overflow-hidden border border-hairline">
                      <Image
                        alt={`${event.title} poster`}
                        className="object-cover"
                        fill
                        sizes="(min-width: 640px) 42rem, 100vw"
                        src={event.poster.publicUrl}
                      />
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            icon={CalendarDays}
            title="No events yet"
            description="Published MELSSA events will appear here."
          />
        </div>
      )}
    </div>
  );
}
