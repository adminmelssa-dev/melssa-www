import {
  DataTableSkeleton,
  StatCardsSkeleton,
} from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function StorageLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-32" />
      </section>

      <StatCardsSkeleton />
      <DataTableSkeleton columns={7} rows={8} />
    </div>
  );
}
