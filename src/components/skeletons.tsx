import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton className="h-24 rounded-xl" key={`stat-${index}`} />
      ))}
    </div>
  );
}

export function DataTableSkeleton({
  rows = 8,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-full max-w-xs" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="ml-auto h-9 w-16" />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center gap-4 border-b bg-muted/40 px-4 py-3">
          {Array.from({ length: columns }, (_, index) => (
            <Skeleton
              className={cn("h-4", index === 0 ? "w-24" : "flex-1")}
              key={`head-${index}`}
            />
          ))}
        </div>
        <div className="divide-y">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div
              className="flex items-center gap-4 px-4 py-3.5"
              key={`row-${rowIndex}`}
            >
              {Array.from({ length: columns }, (_, columnIndex) => (
                <Skeleton
                  className={cn(
                    "h-4",
                    columnIndex === 0 ? "w-24" : "flex-1",
                  )}
                  key={`cell-${rowIndex}-${columnIndex}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
      </div>
    </div>
  );
}

export function PublicPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-7 py-16">
      <div className="border-b border-hairline pb-10">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="mt-5 h-14 w-full max-w-xl" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.45fr_0.75fr]">
        <div className="space-y-8">
          {Array.from({ length: 3 }, (_, index) => (
            <div className="border-b border-hairline pb-8" key={index}>
              <Skeleton className="h-3 w-44" />
              <Skeleton className="mt-4 h-8 w-full max-w-lg" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}
