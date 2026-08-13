import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export default function ProjectNotFound() {
  return (
    <div className="space-y-4">
      <EmptyState icon="✕" title="Project not found" description="It may have been archived, or the link is out of date." />
      <div className="text-center">
        <Link href="/projects" className="text-sm text-(--color-accent) hover:underline">
          ← Back to Projects
        </Link>
      </div>
    </div>
  );
}
