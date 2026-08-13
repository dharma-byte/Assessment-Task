import Link from "next/link";
import { notFound } from "next/navigation";
import { getPersonDetail } from "@/lib/queries";
import Avatar from "@/components/Avatar";
import SkillBadge from "@/components/SkillBadge";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await getPersonDetail(id);
  if (!person) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={person.name} color={person.avatarColor} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold text-(--color-text-primary)">{person.name}</h1>
            <p className="text-(--color-text-secondary)">
              {person.title}
              {person.team && (
                <>
                  {" · "}
                  <Link href="/people" className="hover:underline">
                    {person.team.name}
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
        <Link
          href={`/path?from=${person.id}`}
          className="rounded-lg border border-(--color-border) px-4 py-2 text-sm font-medium text-(--color-text-primary) hover:bg-(--color-surface)"
        >
          Find path from here →
        </Link>
      </div>

      {person.bio && <p className="max-w-2xl text-(--color-text-secondary)">{person.bio}</p>}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">
          Skills ({person.skills.length})
        </h2>
        {person.skills.length === 0 ? (
          <EmptyState title="No skills recorded" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {person.skills
              .slice()
              .sort((a, b) => b.level - a.level)
              .map((s) => (
                <SkillBadge key={s.id} name={s.name} category={s.category} level={s.level} endorsed={s.endorsed} />
              ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">
          Projects ({person.projects.length})
        </h2>
        {person.projects.length === 0 ? (
          <EmptyState title="Not currently staffed on a project" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {person.projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4 hover:border-(--color-accent)"
              >
                <span className="font-medium text-(--color-text-primary)">{p.name}</span>
                <span className="text-xs text-(--color-text-muted)">{p.role}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">
          Direct collaborators ({person.collaborators.length})
        </h2>
        {person.collaborators.length === 0 ? (
          <EmptyState title="No recorded collaborators" description="No KNOWS relationships yet." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {person.collaborators.map((c) => (
              <Link
                key={c.id}
                href={`/people/${c.id}`}
                className="rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-text-primary) hover:border-(--color-accent)"
              >
                {c.name}
                {c.teamName && <span className="text-(--color-text-muted)"> · {c.teamName}</span>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
