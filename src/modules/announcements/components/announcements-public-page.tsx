import { Bell, Download } from "lucide-react";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ANNOUNCEMENT_CATEGORY_LABELS } from "@/modules/announcements/contracts";
import { getSerializedPublishedAnnouncements } from "@/modules/announcements/queries";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export async function AnnouncementsPublicPage() {
  const announcements = await getSerializedPublishedAnnouncements();

  return (
    <div className="mx-auto max-w-6xl px-7 py-16">
      <PublicPageHeader
        kicker="Association updates"
        title="Announcements"
        description="Notices, opportunities and the Weekly MELSSA Bulletin — everything worth knowing, in one place."
      />

      {announcements.length > 0 ? (
        <div className="mt-4 max-w-3xl border-t border-hairline">
          {announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="border-b border-hairline py-10"
            >
              <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.14em] text-gold-ink">
                <span>
                  {ANNOUNCEMENT_CATEGORY_LABELS[announcement.category]}
                </span>
                <span aria-hidden className="h-px w-4 bg-hairline" />
                <span className="text-foreground/45">
                  {formatPublishedDate(announcement.publishedAt)}
                </span>
              </div>
              <h2 className="mt-4 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight">
                {announcement.title}
              </h2>
              {announcement.summary ? (
                <p className="mt-3 text-base leading-relaxed text-foreground/70">
                  {announcement.summary}
                </p>
              ) : null}
              <p className="mt-4 whitespace-pre-line text-[15px] leading-[1.75] text-foreground/80">
                {announcement.body}
              </p>
              {announcement.attachment ? (
                <a
                  href={announcement.attachment.publicUrl}
                  rel="noreferrer"
                  target="_blank"
                  className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-gold-ink"
                >
                  <Download className="size-4" />
                  Download attachment
                </a>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            icon={Bell}
            title="No announcements yet"
            description="Published MELSSA updates will appear here."
          />
        </div>
      )}
    </div>
  );
}

function formatPublishedDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : "Recently published";
}
