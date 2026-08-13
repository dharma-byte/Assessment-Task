import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectDetail, getSuggestedReviewers } from "@/lib/queries";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

const STATUS_LABEL = { active: "Active", maintenance: "Maintenance", planned: "Planned" } as const;
const IMPORTANCE_LABEL: Record<number, string> = { 1: "Nice to have", 2: "Important", 3: "Critical" };

function coverageStatus(coveredBy: string[]): { tone: "good" | "warning" | "critical"; label: string } {
  if (coveredBy.length === 0) return { tone: "critical", label: "No coverage" };
  if (coveredBy.length === 1) return { tone: "warning", label: `Single point of coverage: ${coveredBy[0]}` };
  return { tone: "good", label: `Covered by ${coveredBy.length} people` };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, reviewers] = await Promise.all([getProjectDetail(id), getSuggestedReviewers(id)]);
  if (!project) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-(--color-text-primary)">{project.name}</h1>
          <p className="mt-1 max-w-2xl text-(--color-text-secondary)">{project.description}</p>
        </div>
        <span className="shrink-0 rounded-full border border-(--color-border) px-3 py-1 text-sm text-(--color-text-secondary)">
          {STATUS_LABEL[project.status]}
        </span>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">
          Required skills &amp; coverage
        </h2>
        <div className="overflow-x-auto rounded-xl border border-(--color-border) bg-(--color-surface)">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-(--color-border) text-left text-(--color-text-muted)">
                <th className="px-4 py-2 font-medium">Skill</th>
                <th className="px-4 py-2 font-medium">Importance</th>
                <th className="px-4 py-2 font-medium">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {project.requiredSkills
                .slice()
                .sort((a, b) => b.importance - a.importance)
                .map((s) => {
                  const status = coverageStatus(s.coveredBy);
                  return (
                    <tr key={s.id} className="border-b border-(--color-border) last:border-0">
                      <td className="px-4 py-2.5 font-medium text-(--color-text-primary)">{s.name}</td>
                      <td className="px-4 py-2.5 text-(--color-text-secondary)">
                        {IMPORTANCE_LABEL[s.importance] ?? s.importance}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge tone={status.tone} label={status.label} />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">
          Team ({project.team.length})
        </h2>
        {project.team.length === 0 ? (
          <EmptyState title="No one staffed yet" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {project.team.map((m) => (
              <Link
                key={m.id}
                href={`/people/${m.id}`}
                className="rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-text-primary) hover:border-(--color-accent)"
              >
                {m.name} <span className="text-(--color-text-muted)">· {m.role}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">
          Suggested reviewers
        </h2>
        <p className="text-sm text-(--color-text-secondary)">
          Ranked by recent commit activity across this project&apos;s components — a 2-hop
          traversal from project → component → contributor.
        </p>
        {reviewers.length === 0 ? (
          <EmptyState title="No commit history yet" description="No one has touched this project's components." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {reviewers.map((r) => (
              <Link
                key={r.id}
                href={`/people/${r.id}`}
                className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 hover:border-(--color-accent)"
              >
                <Avatar name={r.name} color={r.avatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-(--color-text-primary)">{r.name}</div>
                  <div className="truncate text-xs text-(--color-text-muted)">
                    {r.teamName} · {r.totalCommits} commits · last {r.lastTouched}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">
          Components ({project.components.length})
        </h2>
        <div className="flex flex-wrap gap-2 font-mono text-xs">
          {project.components.map((c) => (
            <span
              key={c.id}
              className="rounded-md border border-(--color-border) bg-(--color-surface) px-2 py-1 text-(--color-text-secondary)"
            >
              {c.path}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
