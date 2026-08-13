const TONE = {
  good: { color: "var(--status-good)", icon: "✓" },
  warning: { color: "var(--status-warning)", icon: "!" },
  critical: { color: "var(--status-critical)", icon: "✕" },
} as const;

/** Status is always icon + label, never color alone (per accessibility rule). */
export default function StatusBadge({
  tone,
  label,
}: {
  tone: keyof typeof TONE;
  label: string;
}) {
  const { color, icon } = TONE[tone];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) px-2.5 py-1 text-xs font-medium text-(--color-text-secondary)">
      <span
        className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] text-white"
        style={{ backgroundColor: color }}
        aria-hidden
      >
        {icon}
      </span>
      {label}
    </span>
  );
}
