import Link from "next/link";
import { findShortestPath, listPeople } from "@/lib/queries";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";

export default async function PathFinderPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const people = await listPeople();
  const peopleById = new Map(people.map((p) => [p.id, p]));

  const shouldSearch = Boolean(from && to);
  const samePerson = from && to && from === to;
  const path = shouldSearch && !samePerson ? await findShortestPath(from!, to!) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-(--color-text-primary)">Path finder</h1>
        <p className="text-sm text-(--color-text-secondary)">
          Shortest chain of collaborators connecting two people — a variable-length graph
          traversal that a relational join can&apos;t express without knowing the depth in advance.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-(--color-text-secondary)">From</span>
          <select
            name="from"
            defaultValue={from ?? ""}
            required
            className="w-56 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-text-primary) focus:border-(--color-accent) focus:outline-none"
          >
            <option value="" disabled>
              Choose a person…
            </option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-(--color-text-secondary)">To</span>
          <select
            name="to"
            defaultValue={to ?? ""}
            required
            className="w-56 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-text-primary) focus:border-(--color-accent) focus:outline-none"
          >
            <option value="" disabled>
              Choose a person…
            </option>
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
          Find path
        </button>
      </form>

      {!shouldSearch ? (
        <EmptyState icon="⌁" title="Pick two people" description="See the shortest chain of collaborators connecting them." />
      ) : samePerson ? (
        <EmptyState title="Pick two different people" />
      ) : !path ? (
        <EmptyState
          icon="✕"
          title="No connection found"
          description="These two aren't linked through the collaboration network yet."
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-(--color-text-secondary)">
            {path.hops} hop{path.hops === 1 ? "" : "s"} apart
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {path.people.map((p, i) => {
              const full = peopleById.get(p.id);
              return (
                <div key={p.id} className="flex items-center gap-3">
                  {i > 0 && <span className="text-(--color-text-muted)">→ knows →</span>}
                  <Link
                    href={`/people/${p.id}`}
                    className="flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) py-1.5 pl-1.5 pr-3 hover:border-(--color-accent)"
                  >
                    <Avatar name={p.name} color={full?.avatarColor ?? "#2a78d6"} size="sm" />
                    <span className="text-sm font-medium text-(--color-text-primary)">{p.name}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
