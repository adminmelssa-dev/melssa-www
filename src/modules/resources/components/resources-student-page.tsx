import {
  Download,
  FileArchive,
  FileText,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ACADEMIC_LEVEL_LABELS,
  SEMESTER_TERM_LABELS,
} from "@/modules/academics/contracts";
import {
  RESOURCE_TYPE_LABELS,
  type ResourceRow,
} from "@/modules/resources/contracts";
import { getSerializedPublishedResources } from "@/modules/resources/queries";
import { formatBytes } from "@/lib/format-bytes";
import { requireAuth } from "@/server/auth/guards";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});

export async function ResourcesStudentPage() {
  await requireAuth();
  const resources = await getSerializedPublishedResources();
  const stats = getResourceStats(resources);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Academic materials</p>
        <h1 className="font-heading text-2xl font-black">Resources</h1>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatBlock
          icon={FileText}
          label="Published resources"
          value={resources.length}
        />
        <StatBlock
          icon={GraduationCap}
          label="Courses represented"
          value={stats.courseCount}
        />
        <StatBlock
          icon={FileArchive}
          label="Total file size"
          value={formatBytes(stats.totalBytes)}
        />
      </section>

      {resources.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-hairline bg-background">
          <div className="grid gap-px bg-hairline">
            {resources.map((resource) => (
              <ResourceLink key={resource.id} resource={resource} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          icon={FileText}
          title="No resources yet"
          description="Published academic resources will appear here."
        />
      )}
    </div>
  );
}

function ResourceLink({ resource }: { resource: ResourceRow }) {
  return (
    <a
      className="group grid gap-4 bg-background p-4 transition-colors hover:bg-muted/50 sm:grid-cols-[auto_1fr_auto] sm:items-center"
      href={resource.file.publicUrl}
      rel="noreferrer"
      target="_blank"
    >
      <span className="hidden size-11 place-items-center rounded-md border border-hairline text-primary sm:grid">
        <FileText className="size-5" />
      </span>

      <span className="min-w-0 space-y-2">
        <span className="block truncate font-medium">{resource.title}</span>
        <span className="flex flex-wrap gap-2">
          <Badge variant="secondary">{RESOURCE_TYPE_LABELS[resource.type]}</Badge>
          <Badge variant="outline">
            {ACADEMIC_LEVEL_LABELS[resource.level]}
          </Badge>
          <Badge variant="outline">
            {SEMESTER_TERM_LABELS[resource.semester]}
          </Badge>
          {resource.academicYear ? (
            <Badge variant="outline">{resource.academicYear}</Badge>
          ) : null}
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {resource.course
            ? `${resource.course.code} · ${resource.course.title}`
            : "General resource"}
        </span>
      </span>

      <span className="flex items-center justify-between gap-4 text-sm text-muted-foreground sm:justify-end">
        <span>
          {resource.publishedAt
            ? dateFormatter.format(new Date(resource.publishedAt))
            : formatBytes(resource.file.byteSize)}
        </span>
        <span className="inline-flex items-center gap-2 rounded-md border border-hairline px-3 py-2 text-foreground transition-colors group-hover:border-primary group-hover:text-primary">
          <Download className="size-4" />
          <span className="text-sm font-medium">{formatBytes(resource.file.byteSize)}</span>
        </span>
      </span>
    </a>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-background p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
        <div>
          <div className="text-xl font-black">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

function getResourceStats(resources: ResourceRow[]) {
  const courseIds = new Set(
    resources
      .map((resource) => resource.course?.id)
      .filter((courseId): courseId is number => typeof courseId === "number"),
  );

  return {
    courseCount: courseIds.size,
    totalBytes: resources.reduce(
      (total, resource) => total + resource.file.byteSize,
      0,
    ),
  };
}
