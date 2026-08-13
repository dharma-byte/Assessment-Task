import { listPeople } from "@/lib/queries";
import PersonCard from "@/components/PersonCard";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const people = await listPeople();
  const filtered = q
    ? people.filter(
        (p) =>
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          p.title.toLowerCase().includes(q.toLowerCase()) ||
          (p.teamName ?? "").toLowerCase().includes(q.toLowerCase())
      )
    : people;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-(--color-text-primary)">People</h1>
          <p className="text-sm text-(--color-text-secondary)">{people.length} across the org</p>
        </div>
        <form method="get" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name, title, or team…"
            className="w-72 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:outline-none"
          />
        </form>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No one matches that search"
          description="Try a different name, title, or team."
          icon="⌕"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      )}
    </div>
  );
}
