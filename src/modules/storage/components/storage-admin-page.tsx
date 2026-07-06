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
import type { StorageObjectRow } from "@/modules/storage/contracts";
import { getSerializedStorageObjects } from "@/modules/storage/queries";
import { formatBytes } from "@/lib/format-bytes";
import { requirePermission } from "@/server/auth/guards";

interface StorageAdminStats {
  totalObjects: number;
  completedObjects: number;
  deletedObjects: number;
  completedBytes: number;
}

export async function StorageAdminPage() {
  await requirePermission({ resource: "storage", action: "audit" });
  const storageObjects = await getSerializedStorageObjects();
  const stats = getStorageAdminStats(storageObjects);

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

      <StorageTable initialStorageObjects={storageObjects} />
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

function getStorageAdminStats(
  storageObjects: StorageObjectRow[],
): StorageAdminStats {
  const completedObjects = storageObjects.filter(
    (object) => object.status === "completed",
  );

  return {
    totalObjects: storageObjects.length,
    completedObjects: completedObjects.length,
    deletedObjects: storageObjects.filter((object) => object.status === "deleted")
      .length,
    completedBytes: completedObjects.reduce(
      (total, object) => total + object.byteSize,
      0,
    ),
  };
}
