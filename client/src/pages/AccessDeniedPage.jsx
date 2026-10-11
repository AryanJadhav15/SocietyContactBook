import { Link } from 'react-router-dom';

export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold text-ink">Access denied</h1>
        <p className="mt-2 text-slate-600">Your account does not have permission to open that page.</p>
        <Link className="btn-primary mt-5" to="/">Back to dashboard</Link>
      </div>
    </main>
  );
}
