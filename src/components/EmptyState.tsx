export default function EmptyState({
  title,
  description,
  icon = "○",
}: {
  title: string;
  description?: string;
  icon?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-(--color-border) px-6 py-14 text-center">
      <span className="text-3xl text-(--color-text-muted)" aria-hidden>
        {icon}
      </span>
      <p className="font-medium text-(--color-text-primary)">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-(--color-text-secondary)">{description}</p>
      )}
    </div>
  );
}
