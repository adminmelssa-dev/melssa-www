import { Award, ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SCHOLARSHIP_APPLICATION_MODE_LABELS,
  type ScholarshipProgramRow,
} from "@/modules/scholarships/contracts";
import { getSerializedPublishedScholarshipPrograms } from "@/modules/scholarships/queries";

export async function ScholarshipsPublicPage() {
  const programs = await getSerializedPublishedScholarshipPrograms();

  return (
    <main className="bg-paper text-foreground">
      <section className="border-b border-hairline bg-navy-deep py-20 text-cream">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold-bright">
            Scholarships
          </p>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-black md:text-6xl">
            Scholarship information students can act on.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-cream/75">
            Find published opportunities, eligibility details, deadlines, and
            application links shared by MELSSA.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        {programs.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {programs.map((program) => (
              <ScholarshipCard key={program.id} program={program} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-paper-2 text-center">
            <Award className="size-10 text-foreground/35" />
            <h2 className="mt-4 font-heading text-2xl font-black">
              No scholarships published yet
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Scholarship opportunities will appear here once MELSSA publishes
              them.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function ScholarshipCard({ program }: { program: ScholarshipProgramRow }) {
  return (
    <article className="rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{program.providerName}</Badge>
        <Badge variant="outline">
          {SCHOLARSHIP_APPLICATION_MODE_LABELS[program.applicationMode]}
        </Badge>
      </div>
      <h2 className="mt-4 font-heading text-2xl font-black">{program.title}</h2>
      {program.summary ? (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {program.summary}
        </p>
      ) : null}
      <dl className="mt-5 grid gap-3 text-sm">
        {program.amountDescription ? (
          <InfoLine label="Award" value={program.amountDescription} />
        ) : null}
        {program.academicYear ? (
          <InfoLine label="Academic year" value={program.academicYear} />
        ) : null}
        {program.closesAt ? (
          <InfoLine label="Deadline" value={formatDate(program.closesAt)} />
        ) : null}
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        {program.applicationUrl ? (
          <Button asChild size="sm" variant="gold">
            <a href={program.applicationUrl} rel="noreferrer" target="_blank">
              <ExternalLink className="size-4" />
              Apply externally
            </a>
          </Button>
        ) : null}
        {program.attachment ? (
          <Button asChild size="sm" variant="outline">
            <a href={program.attachment.publicUrl} rel="noreferrer" target="_blank">
              <FileText className="size-4" />
              View attachment
            </a>
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
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
