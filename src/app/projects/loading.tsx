import { Skeleton, CardGridSkeleton } from "@/components/Skeleton";

export default function ProjectsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <CardGridSkeleton count={6} />
    </div>
  );
}
