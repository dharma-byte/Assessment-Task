import { Skeleton, CardGridSkeleton } from "@/components/Skeleton";

export default function PeopleLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-72" />
      </div>
      <CardGridSkeleton count={9} />
    </div>
  );
}
