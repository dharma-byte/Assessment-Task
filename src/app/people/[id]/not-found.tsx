import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export default function PersonNotFound() {
  return (
    <div className="space-y-4">
      <EmptyState
        icon="✕"
        title="Person not found"
        description="They may have left the org, or the link is out of date."
      />
      <div className="text-center">
        <Link href="/people" className="text-sm text-(--color-accent) hover:underline">
          ← Back to People
        </Link>
      </div>
    </div>
  );
}
