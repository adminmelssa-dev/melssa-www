import {
  DataTableSkeleton,
  StatCardsSkeleton,
} from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ScholarshipsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-52" />
      </section>

      <StatCardsSkeleton />
      <DataTableSkeleton columns={5} rows={8} />
    </div>
  );
}
