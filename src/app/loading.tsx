import { Skeleton, CardGridSkeleton } from "@/components/Skeleton";

export default function HomeLoading() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-2/3 max-w-2xl" />
      </section>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <CardGridSkeleton count={3} />
    </div>
  );
}
