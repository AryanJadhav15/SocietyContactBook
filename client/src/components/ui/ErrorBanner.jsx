export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--color-danger)]">
      {message}
    </div>
  );
}
