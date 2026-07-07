import {
  Database,
  HardDrive,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StorageTable } from "@/modules/storage/components/storage-table";
import {
  getSerializedStorageObjectPage,
  getStorageAdminStats,
} from "@/modules/storage/queries";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { formatBytes } from "@/lib/format-bytes";
import { requirePermission } from "@/server/auth/guards";

export async function StorageAdminPage() {
  await requirePermission({ resource: "storage", action: "audit" });
  const [storagePage, stats] = await Promise.all([
    getSerializedStorageObjectPage(parseDataTableQuery(new URLSearchParams())),
    getStorageAdminStats(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">File registry</p>
        <h1 className="font-heading text-2xl font-black">Storage</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={HardDrive} label="Objects" value={stats.totalObjects} />
        <StatCard
          icon={UploadCloud}
          label="Completed"
          value={stats.completedObjects}
        />
        <StatCard
          icon={Trash2}
          label="Deleted"
          value={stats.deletedObjects}
        />
        <StatCard
          icon={Database}
          label="Completed Size"
          value={formatBytes(stats.completedBytes)}
        />
      </section>

      <StorageTable
        initialMeta={storagePage.meta}
        initialStorageObjects={storagePage.items}
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
  value: number | string;
  icon: typeof HardDrive;
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
