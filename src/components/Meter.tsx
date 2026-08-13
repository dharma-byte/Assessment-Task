/** A same-ramp meter: neutral track, blue fill, clamped to [0, 1]. */
export default function Meter({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full bg-(--color-gridline)"
        role="meter"
        aria-valuenow={Math.round(pct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "match score"}
      >
        <div
          className="h-full rounded-full bg-(--color-series-blue)"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-(--color-text-muted)">
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}
