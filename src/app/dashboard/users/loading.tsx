import {
  DataTableSkeleton,
  StatCardsSkeleton,
} from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-9 w-28" />
      </section>

      <StatCardsSkeleton />
      <DataTableSkeleton columns={7} rows={8} />
    </div>
  );
}
