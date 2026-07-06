import { Download, FileText } from "lucide-react";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ACADEMIC_LEVEL_LABELS,
  SEMESTER_TERM_LABELS,
} from "@/modules/academics/contracts";
import { RESOURCE_TYPE_LABELS } from "@/modules/resources/contracts";
import { getSerializedPublishedResources } from "@/modules/resources/queries";
import { formatBytes } from "@/lib/format-bytes";

export async function ResourcesPublicPage() {
  const resources = await getSerializedPublishedResources();

  return (
    <div className="mx-auto max-w-6xl px-7 py-16">
      <PublicPageHeader
        kicker="Academic archive"
        title="Resources"
        description="Lecture slides, past questions and reference materials — organized by level, semester, course and academic year."
      />

      {resources.length > 0 ? (
        <div className="mt-6 max-w-4xl border-t border-hairline">
          {resources.map((resource) => (
            <a
              key={resource.id}
              href={resource.file.publicUrl}
              rel="noreferrer"
              target="_blank"
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 border-b border-hairline py-5 transition-colors hover:bg-paper-2 sm:grid-cols-[auto_1fr_auto_auto] sm:gap-7"
            >
              <span className="grid size-11 place-items-center rounded border border-hairline text-gold-ink">
                <FileText className="size-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground">
                  {resource.title}
                </span>
                <span className="block truncate text-[12.5px] text-foreground/55">
                  {resource.course
                    ? `${resource.course.code} · ${resource.course.title}`
                    : "General"}
                  {resource.academicYear ? ` · ${resource.academicYear}` : ""}
                </span>
              </span>
              <span className="hidden text-[11px] uppercase tracking-[0.1em] text-foreground/55 sm:block">
                {ACADEMIC_LEVEL_LABELS[resource.level]} ·{" "}
                {SEMESTER_TERM_LABELS[resource.semester]} ·{" "}
                {RESOURCE_TYPE_LABELS[resource.type]}
              </span>
              <span className="inline-flex items-center gap-4">
                <span className="hidden whitespace-nowrap text-[12.5px] text-foreground/50 sm:block">
                  {formatBytes(resource.file.byteSize)}
                </span>
                <Download className="size-[18px] text-foreground/40 transition-colors group-hover:text-gold-ink" />
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            icon={FileText}
            title="No resources yet"
            description="Published academic resources will appear here."
          />
        </div>
      )}
    </div>
  );
}
