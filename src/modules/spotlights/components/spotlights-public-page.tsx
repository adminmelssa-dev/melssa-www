import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Kicker } from "@/components/ui/kicker";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getSerializedPublishedSpotlights } from "@/modules/spotlights/queries";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export async function SpotlightsPublicPage() {
  const spotlights = await getSerializedPublishedSpotlights();

  return (
    <div className="mx-auto max-w-6xl px-7 py-16">
      <PublicPageHeader
        kicker="Student stories"
        title="Spotlight"
        description="Celebrating the achievements, leadership and research of MELSSA members."
      />

      {spotlights.length > 0 ? (
        <div className="mt-6 max-w-3xl border-t border-hairline">
          {spotlights.map((spotlight) => (
            <article
              key={spotlight.id}
              className="border-b border-hairline py-12"
            >
              {spotlight.photo ? (
                <div className="relative mb-7 aspect-[16/9] overflow-hidden border border-hairline">
                  <Image
                    alt={spotlight.studentName}
                    className="object-cover"
                    fill
                    sizes="(min-width: 896px) 56rem, 100vw"
                    src={spotlight.photo.publicUrl}
                  />
                </div>
              ) : null}
              <Kicker>Student spotlight</Kicker>
              <h2 className="mt-4 text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight">
                {spotlight.studentName}
              </h2>
              <p className="mt-1.5 text-[15px] font-medium text-gold-ink">
                {spotlight.headline}
              </p>
              <p className="mt-5 whitespace-pre-line text-[15.5px] leading-[1.8] text-foreground/80">
                {spotlight.body}
              </p>
              {spotlight.publishedAt ? (
                <p className="mt-6 text-xs uppercase tracking-[0.12em] text-foreground/40">
                  {dateFormatter.format(new Date(spotlight.publishedAt))}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            icon={Sparkles}
            title="No spotlights yet"
            description="Featured student stories will appear here."
          />
        </div>
      )}
    </div>
  );
}
