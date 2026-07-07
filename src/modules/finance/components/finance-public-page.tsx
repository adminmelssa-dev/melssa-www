import { ArrowUpRight, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { Reveal } from "@/components/ui/reveal";
import { SEMESTER_TERM_LABELS } from "@/modules/academics/contracts";
import {
  FINANCE_DOCUMENT_TYPE_LABELS,
  type FinanceDocumentRow,
} from "@/modules/finance/contracts";
import { getSerializedPublishedFinanceDocuments } from "@/modules/finance/queries";
import { formatBytes } from "@/lib/format-bytes";

export async function FinancePublicPage() {
  const documents = await getSerializedPublishedFinanceDocuments();
  const groups = groupByAcademicYear(documents);

  return (
    <div className="mx-auto max-w-6xl px-7 py-16">
      <PublicPageHeader
        kicker="Finance Desk"
        title="Open books"
        description="Semester and annual financial reports, alongside the approved budgets behind every major programme — published for every member to read, verify and download."
      />

      {groups.length > 0 ? (
        <div className="mt-12 space-y-14">
          {groups.map((group) => (
            <Reveal key={group.academicYear}>
              <div className="flex items-baseline gap-5">
                <h2 className="text-[clamp(1.35rem,2vw,1.75rem)] text-gold-ink">
                  {group.academicYear}
                </h2>
                <span aria-hidden className="h-px flex-1 bg-hairline" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/40">
                  {group.documents.length}{" "}
                  {group.documents.length === 1 ? "document" : "documents"}
                </span>
              </div>
              <div className="mt-1 border-t border-hairline">
                {group.documents.map((document) => (
                  <DocumentRow document={document} key={document.id} />
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            description="Financial reports and programme budgets will appear here as the Finance Desk begins publishing."
            icon={FileText}
            title="No reports published yet"
          />
        </div>
      )}
    </div>
  );
}

function DocumentRow({ document }: { document: FinanceDocumentRow }) {
  if (!document.file) return null;

  const tags = [
    FINANCE_DOCUMENT_TYPE_LABELS[document.type],
    document.semester ? SEMESTER_TERM_LABELS[document.semester] : null,
    document.programmeName,
  ].filter((item): item is string => Boolean(item));

  return (
    <article className="grid grid-cols-[auto_1fr] items-start gap-5 border-b border-hairline py-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-7">
      <span className="grid size-11 place-items-center rounded border border-hairline text-gold-ink">
        <FileText className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-ink">
          <span>{tags[0]}</span>
          {tags.slice(1).map((tag) => (
            <span className="text-foreground/40" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <h3 className="mt-1.5 truncate font-medium text-foreground">
          {document.title}
        </h3>
        <p className="mt-1 text-[12.5px] text-foreground/55">
          {document.datePresented
            ? `Presented ${formatDate(document.datePresented)} · `
            : ""}
          <span className="font-mono uppercase">
            PDF · {formatBytes(document.file.byteSize)}
          </span>
        </p>
      </div>
      <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:justify-end">
        <Button asChild className="rounded-full" size="sm" variant="outline">
          <a href={document.file.publicUrl} rel="noreferrer" target="_blank">
            <ArrowUpRight className="size-4" />
            View
          </a>
        </Button>
        <Button asChild className="rounded-full" size="sm" variant="ghost">
          <a download href={document.file.publicUrl}>
            <Download className="size-4" />
            Download
          </a>
        </Button>
      </div>
    </article>
  );
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function groupByAcademicYear(documents: FinanceDocumentRow[]): {
  academicYear: string;
  documents: FinanceDocumentRow[];
}[] {
  const groups = new Map<string, FinanceDocumentRow[]>();

  for (const document of documents) {
    const existing = groups.get(document.academicYear);
    if (existing) {
      existing.push(document);
    } else {
      groups.set(document.academicYear, [document]);
    }
  }

  return Array.from(groups.entries()).map(([academicYear, groupDocuments]) => ({
    academicYear,
    documents: groupDocuments,
  }));
}
