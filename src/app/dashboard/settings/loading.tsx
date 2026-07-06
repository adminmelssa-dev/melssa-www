import {
  StatCardsSkeleton,
} from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="space-y-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-9 w-36" />
      </section>

      <StatCardsSkeleton />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Skeleton className="h-[520px]" />
        <Skeleton className="h-[720px]" />
      </div>
    </div>
  );
}
