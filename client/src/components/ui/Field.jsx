export default function Field({ label, children }) {
  return (
    <label className="space-y-1">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
