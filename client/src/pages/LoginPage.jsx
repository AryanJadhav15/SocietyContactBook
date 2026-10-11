import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';

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
    <main className="grid min-h-screen place-items-center bg-surface px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-brand text-white"><LockKeyhole size={22} /></span>
          <div>
            <h1 className="text-xl font-bold text-ink">Society Contact Book</h1>
            <p className="text-sm text-slate-500">Sign in to your society directory</p>
          </div>
        </div>
        <ErrorBanner message={error} />
        <div className="mt-4 space-y-4">
          <label className="space-y-1">
            <span className="label">Email</span>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label className="space-y-1">
            <span className="label">Password</span>
            <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </label>
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Signing in...' : 'Sign in'}</button>
        </div>
      </form>
    </main>
  );
}
