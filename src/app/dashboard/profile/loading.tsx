import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="space-y-2 border-b border-hairline pb-7">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-96" />
      </section>
      <Skeleton className="h-80" />
    </div>
  );
}
