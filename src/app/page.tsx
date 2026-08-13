import Link from "next/link";
import { getOverviewStats, listProjects } from "@/lib/queries";
import StatTile from "@/components/StatTile";
import ProjectCard from "@/components/ProjectCard";

// Live graph data, not build-time content — always render per-request rather
// than attempting to prerender against the database at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, projects] = await Promise.all([getOverviewStats(), listProjects()]);
  const spotlightProjects = projects.slice(0, 3);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold text-(--color-text-primary)">
          Who can help with that?
        </h1>
        <p className="max-w-2xl text-(--color-text-secondary)">
          TeamGraph maps your engineering org as a graph — people, skills, teams,
          projects, and the code they touch — so you can find the right expert,
          spot under-staffed projects, and see how anyone connects to anyone
          else, all in a couple of hops.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/experts"
            className="rounded-lg px-4 py-2 text-sm font-medium text-(--color-accent-ink)"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Find an expert
          </Link>
          <Link
            href="/path"
            className="rounded-lg border border-(--color-border) px-4 py-2 text-sm font-medium text-(--color-text-primary) hover:bg-(--color-surface)"
          >
            Explore the network
          </Link>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatTile label="People" value={stats.people} />
          <StatTile label="Teams" value={stats.teams} />
          <StatTile label="Skills" value={stats.skills} />
          <StatTile label="Projects" value={stats.projects} />
          <StatTile label="Skill gaps" value={stats.skillGaps} tone={stats.skillGaps > 0 ? "critical" : "default"} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-(--color-text-primary)">Active projects</h2>
          <Link href="/projects" className="text-sm text-(--color-accent) hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {spotlightProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
