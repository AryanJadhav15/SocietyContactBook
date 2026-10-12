import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center bg-[var(--color-background)] px-4 py-8 overflow-hidden">
      {/* Ambient background aura for full-stack polish */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 transform">
        <div className="h-96 w-[32rem] rounded-full bg-[var(--color-accent)]/10 blur-3xl" />
      </div>

      {/* Top right theme toggle */}
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-modal sm:p-8">
        {/* Branding header */}
        <div className="mb-6 flex items-center gap-3.5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] text-[var(--color-accent-emphasis)] shadow-sm">
            <Shield size={24} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Society Contact Book
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Residential directory administration
            </p>
          </div>
        </div>

        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="label">Email Address</span>
            <input
              className="input"
              type="email"
              placeholder="admin@society.org"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="label">Password</span>
            <input
              className="input"
              type="password"
              placeholder="••••••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>

          <button type="submit" className="btn-primary w-full py-2.5" disabled={saving}>
            {saving ? 'Signing in...' : 'Sign in to Directory'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--color-text-secondary)]">
          Secure portal for registered society residents and administrators.
        </p>
      </div>
    </main>
  );
}
