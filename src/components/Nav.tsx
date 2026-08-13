import Link from "next/link";
import { checkHealth } from "@/lib/db";

const LINKS = [
  { href: "/experts", label: "Find an Expert" },
  { href: "/people", label: "People" },
  { href: "/projects", label: "Projects" },
  { href: "/path", label: "Path Finder" },
];

export default async function Nav() {
  const health = await checkHealth();

  return (
    <header className="border-b border-(--color-border) bg-(--color-surface)">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-(--color-text-primary)">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-(--color-accent-ink)"
            style={{ backgroundColor: "var(--accent)" }}
            aria-hidden
          >
            TG
          </span>
          TeamGraph
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-(--color-text-secondary) transition-colors hover:bg-(--color-page-plane) hover:text-(--color-text-primary)"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-(--color-text-muted)">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: health.ok ? "var(--status-good)" : "var(--status-critical)" }}
            aria-hidden
          />
          {health.ok ? "CognoDB connected" : "Database unreachable"}
        </div>
      </div>
    </header>
  );
}
