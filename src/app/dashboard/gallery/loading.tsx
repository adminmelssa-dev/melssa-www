import {
  DataTableSkeleton,
  StatCardsSkeleton,
} from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-32" />
      </section>

      <StatCardsSkeleton />

      <div className="space-y-3">
        <div className="flex justify-end">
          <Skeleton className="h-8 w-28" />
        </div>
        <DataTableSkeleton columns={6} rows={8} />
      </div>
    </div>
  );
}
