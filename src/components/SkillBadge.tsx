import type { SkillCategory } from "@/lib/types";

const CATEGORY_COLOR: Record<SkillCategory, string> = {
  language: "var(--series-blue)",
  framework: "var(--series-orange)",
  domain: "var(--series-aqua)",
  tool: "var(--series-yellow)",
};

export default function SkillBadge({
  name,
  category,
  level,
  endorsed,
}: {
  name: string;
  category: SkillCategory;
  level?: number;
  endorsed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-2.5 py-1 text-xs text-(--color-text-secondary)">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: CATEGORY_COLOR[category] }}
        aria-hidden
      />
      <span className="font-medium text-(--color-text-primary)">{name}</span>
      {typeof level === "number" && (
        <span className="text-(--color-text-muted)">· L{level}</span>
      )}
      {endorsed && (
        <span className="text-(--color-status-good)" title="Endorsed">
          ✓
        </span>
      )}
    </span>
  );
}
