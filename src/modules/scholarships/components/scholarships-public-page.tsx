import {
  Award,
  CalendarDays,
  ExternalLink,
  FileText,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { Reveal } from "@/components/ui/reveal";
import {
  SCHOLARSHIP_APPLICATION_MODE_LABELS,
  type ScholarshipProgramRow,
} from "@/modules/scholarships/contracts";
import { getSerializedPublishedScholarshipPrograms } from "@/modules/scholarships/queries";

export async function ScholarshipsPublicPage() {
  const programs = await getSerializedPublishedScholarshipPrograms();

  return (
    <main className="mx-auto max-w-6xl px-7 py-16">
      <PublicPageHeader
        kicker="Student Support"
        title="Scholarships & awards"
        description="Published opportunities, eligibility notes, deadlines and application links gathered in one place so members can move before a window closes."
      />

      <section className="mt-12">
        {programs.length > 0 ? (
          <div className="space-y-7">
            {programs.map((program) => (
              <Reveal key={program.id}>
                <ScholarshipArticle program={program} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            description="Scholarship opportunities will appear here once MELSSA publishes them."
            icon={Award}
            title="No scholarships published yet"
          />
        )}
      </section>
    </main>
  );
}

function ScholarshipArticle({ program }: { program: ScholarshipProgramRow }) {
  const timeline = getTimelineLabel(program);

  return (
    <article className="border border-hairline bg-paper-2">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="p-7 sm:p-9">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Badge variant="secondary">{program.providerName}</Badge>
            <Badge variant="outline">
              {SCHOLARSHIP_APPLICATION_MODE_LABELS[program.applicationMode]}
            </Badge>
            {program.academicYear ? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/45">
                {program.academicYear}
              </span>
            ) : null}
          </div>

          <h2 className="mt-4 max-w-2xl text-[clamp(1.55rem,2.4vw,2.15rem)] leading-[1.08]">
            {program.title}
          </h2>

          {program.summary ? (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-foreground/70">
              {program.summary}
            </p>
          ) : null}

          <div className="mt-7 grid gap-6 border-t border-hairline pt-6 md:grid-cols-2">
            {program.amountDescription ? (
              <DetailBlock label="Award" value={program.amountDescription} />
            ) : null}
            {timeline ? <DetailBlock label="Timeline" value={timeline} /> : null}
            {program.eligibility ? (
              <DetailBlock label="Eligibility" value={program.eligibility} />
            ) : null}
            {program.requirements ? (
              <DetailBlock label="Requirements" value={program.requirements} />
            ) : null}
          </div>

          {program.applicationInstructions ? (
            <div className="mt-7 border-t border-hairline pt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-ink">
                Application notes
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/70">
                {program.applicationInstructions}
              </p>
            </div>
          ) : null}
        </div>

        <aside className="border-t border-hairline bg-paper p-7 lg:border-l lg:border-t-0">
          <div className="space-y-5">
            {program.closesAt ? (
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/45">
                  <CalendarDays className="size-3.5" />
                  Deadline
                </p>
                <p className="mt-2 text-2xl text-gold-ink">
                  {formatDate(program.closesAt)}
                </p>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              {program.applicationUrl ? (
                <Button asChild className="rounded-full" variant="gold">
                  <a
                    href={program.applicationUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink className="size-4" />
                    Apply externally
                  </a>
                </Button>
              ) : null}
              {program.attachment ? (
                <Button asChild className="rounded-full" variant="outline">
                  <a
                    href={program.attachment.publicUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <FileText className="size-4" />
                    View attachment
                  </a>
                </Button>
              ) : null}
              {program.contactEmail ? (
                <Button asChild className="rounded-full" variant="ghost">
                  <a href={`mailto:${program.contactEmail}`}>
                    <Mail className="size-4" />
                    Contact provider
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/45">
        {label}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/75">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getTimelineLabel(program: ScholarshipProgramRow): string | null {
  if (program.opensAt && program.closesAt) {
    return `${formatDate(program.opensAt)} - ${formatDate(program.closesAt)}`;
  }

  if (program.opensAt) return `Opens ${formatDate(program.opensAt)}`;
  if (program.closesAt) return `Closes ${formatDate(program.closesAt)}`;
  return null;
}
