import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';

export default function AccessDeniedPage() {
  return (
    <main className="relative grid min-h-screen place-items-center bg-[var(--color-background)] px-4 py-8 text-center">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-card">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]">
          <ShieldAlert size={24} />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Access Denied
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Your account does not have sufficient permissions to view this section. Please contact your society administrator.
        </p>
        <div className="mt-6">
          <Link className="btn-primary inline-flex" to="/">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
