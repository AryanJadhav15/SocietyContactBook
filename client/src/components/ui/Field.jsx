export default function Field({ label, children, required = false }) {
  return (
    <label className="block space-y-1.5">
      <span className="label flex items-center gap-1">
        {label}
        {required && <span className="text-[var(--color-accent)]">*</span>}
      </span>
      {children}
    </label>
  );
}
