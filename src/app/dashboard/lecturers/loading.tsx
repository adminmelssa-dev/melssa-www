import {
  DataTableSkeleton,
  StatCardsSkeleton,
} from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function LecturersLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-44" />
      </section>

      <StatCardsSkeleton />

      <div className="space-y-3">
        <div className="flex justify-end">
          <Skeleton className="h-8 w-32" />
        </div>
        <DataTableSkeleton columns={5} rows={8} />
      </div>
    </div>
  );
}
