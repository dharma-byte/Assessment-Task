export default function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "critical";
}) {
  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) px-5 py-4">
      <div className="text-sm text-(--color-text-secondary)">{label}</div>
      <div
        className="mt-1 text-3xl font-semibold tabular-nums"
        style={{ color: tone === "critical" ? "var(--status-critical)" : "var(--text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}
