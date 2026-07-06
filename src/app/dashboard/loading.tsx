import {
  DataTableSkeleton,
  StatCardsSkeleton,
} from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-9">
      <section className="border-b border-hairline pb-7">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="mt-3 h-10 w-80 max-w-full" />
      </section>

      <StatCardsSkeleton />

      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
        <Skeleton className="h-96" />
        <div className="space-y-10">
          <Skeleton className="h-56" />
          <Skeleton className="h-64" />
        </div>
      </div>

      <DataTableSkeleton columns={5} rows={5} />
    </div>
  );
}
