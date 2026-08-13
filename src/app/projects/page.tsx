import { listProjects } from "@/lib/queries";
import ProjectCard from "@/components/ProjectCard";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-(--color-text-primary)">Projects</h1>
        <p className="text-sm text-(--color-text-secondary)">{projects.length} tracked</p>
      </div>

      {projects.length === 0 ? (
        <EmptyState title="No projects yet" description="Run the seed script to load demo data." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
