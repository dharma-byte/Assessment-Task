import Link from "next/link";
import Avatar from "./Avatar";
import type { PersonSummary } from "@/lib/types";

export default function PersonCard({ person }: { person: PersonSummary }) {
  return (
    <Link
      href={`/people/${person.id}`}
      className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-colors hover:border-(--color-accent)"
    >
      <Avatar name={person.name} color={person.avatarColor} />
      <div className="min-w-0">
        <div className="truncate font-medium text-(--color-text-primary)">{person.name}</div>
        <div className="truncate text-sm text-(--color-text-secondary)">
          {person.title}
          {person.teamName && <span className="text-(--color-text-muted)"> · {person.teamName}</span>}
        </div>
      </div>
    </Link>
  );
}
