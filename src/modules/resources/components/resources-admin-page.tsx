import {
  Archive,
  FileText,
  Upload,
  Workflow,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSerializedCourses } from "@/modules/academics/queries";
import { ResourcesTable } from "@/modules/resources/components/resources-table";
import {
  getResourcesAdminStats,
  getSerializedResourcePage,
} from "@/modules/resources/queries";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requirePermission } from "@/server/auth/guards";

export async function ResourcesAdminPage() {
  const session = await requirePermission({
    resource: "resource",
    action: "read",
  });
  const [resourcePage, courses, stats] = await Promise.all([
    getSerializedResourcePage(parseDataTableQuery(new URLSearchParams())),
    getSerializedCourses(),
    getResourcesAdminStats(),
  ]);
  const permissions = {
    canCreate: session.permissions.has({
      resource: "resource",
      action: "create",
    }),
    canUpdate: session.permissions.has({
      resource: "resource",
      action: "update",
    }),
    canDelete: session.permissions.has({
      resource: "resource",
      action: "delete",
    }),
    canPublish: session.permissions.has({
      resource: "resource",
      action: "publish",
    }),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Academic materials</p>
        <h1 className="font-heading text-2xl font-black">Resources</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Resources"
          value={stats.totalResources}
        />
        <StatCard
          icon={Upload}
          label="Published"
          value={stats.publishedResources}
        />
        <StatCard icon={Workflow} label="Drafts" value={stats.draftResources} />
        <StatCard
          icon={Archive}
          label="Archived"
          value={stats.archivedResources}
        />
      </section>

      <ResourcesTable
        initialCourses={courses}
        initialMeta={resourcePage.meta}
        initialResources={resourcePage.items}
        permissions={permissions}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
        <div>
          <CardTitle className="text-2xl font-black">{value}</CardTitle>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardHeader>
    </Card>
  );
}
