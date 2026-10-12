export default function EmptyState({ title, message, action }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
