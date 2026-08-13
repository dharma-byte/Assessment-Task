import { findExperts, listPeople, listSkills } from "@/lib/queries";
import Avatar from "@/components/Avatar";
import Meter from "@/components/Meter";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

const REASON_STYLE: Record<string, string> = {
  direct: "border-(--color-series-blue)",
  "related-skill": "border-(--color-series-aqua)",
  network: "border-(--color-series-orange)",
};

export default async function ExpertsPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string; minLevel?: string; network?: string }>;
}) {
  const { skill: skillId, minLevel: minLevelRaw, network: networkFromPersonId } = await searchParams;
  const minLevel = minLevelRaw ? Number(minLevelRaw) : 1;

  const [skills, people] = await Promise.all([listSkills(), listPeople()]);
  const matches = skillId
    ? await findExperts({ skillId, minLevel, networkFromPersonId: networkFromPersonId || undefined })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-(--color-text-primary)">Find an expert</h1>
        <p className="text-sm text-(--color-text-secondary)">
          Ranks people by direct skill match, by walking the skill-adjacency graph for related
          expertise, and — optionally — by how close they are to you in the collaboration network.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-(--color-text-secondary)">Skill</span>
          <select
            name="skill"
            defaultValue={skillId ?? ""}
            required
            className="w-56 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-text-primary) focus:border-(--color-accent) focus:outline-none"
          >
            <option value="" disabled>
              Choose a skill…
            </option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-(--color-text-secondary)">Min. level</span>
          <select
            name="minLevel"
            defaultValue={minLevelRaw ?? "1"}
            className="w-32 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-text-primary) focus:border-(--color-accent) focus:outline-none"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-(--color-text-secondary)">Boost people near (optional)</span>
          <select
            name="network"
            defaultValue={networkFromPersonId ?? ""}
            className="w-56 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-text-primary) focus:border-(--color-accent) focus:outline-none"
          >
            <option value="">No one in particular</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-sm font-medium text-(--color-accent-ink)"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Search
        </button>
      </form>

      {!skillId ? (
        <EmptyState
          icon="⌕"
          title="Pick a skill to search"
          description="Results are ranked by direct match, related-skill strength, and network distance."
        />
      ) : matches.length === 0 ? (
        <EmptyState
          icon="○"
          title="No matches"
          description="Try lowering the minimum level, or a different skill."
        />
      ) : (
        <ol className="space-y-3">
          {matches.map((m, i) => (
            <li
              key={m.person.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
            >
              <span className="w-6 shrink-0 text-center text-sm text-(--color-text-muted) tabular-nums">
                {i + 1}
              </span>
              <Avatar name={m.person.name} color={m.person.avatarColor} />
              <div className="min-w-0 flex-1">
                <Link href={`/people/${m.person.id}`} className="font-medium text-(--color-text-primary) hover:underline">
                  {m.person.name}
                </Link>
                <div className="text-sm text-(--color-text-secondary)">
                  {m.person.title}
                  {m.person.teamName && <span className="text-(--color-text-muted)"> · {m.person.teamName}</span>}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {m.reasons.map((r, ri) => (
                    <span
                      key={ri}
                      className={`rounded-full border bg-(--color-page-plane) px-2 py-0.5 text-xs text-(--color-text-secondary) ${REASON_STYLE[r.kind] ?? "border-(--color-border)"}`}
                    >
                      {r.label}
                    </span>
                  ))}
                </div>
              </div>
              <Meter value={m.score} label={`${m.person.name} match score`} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
