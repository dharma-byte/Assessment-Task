import Link from "next/link";
import type { ProjectSummary } from "@/lib/types";

const STATUS_LABEL: Record<ProjectSummary["status"], string> = {
  active: "Active",
  maintenance: "Maintenance",
  planned: "Planned",
};

export default function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex flex-col gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-colors hover:border-(--color-accent)"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium text-(--color-text-primary)">{project.name}</span>
        <span className="shrink-0 rounded-full border border-(--color-border) px-2 py-0.5 text-xs text-(--color-text-secondary)">
          {STATUS_LABEL[project.status]}
        </span>
      </div>
      <p className="text-sm text-(--color-text-secondary)">{project.description}</p>
    </Link>
  );
}
