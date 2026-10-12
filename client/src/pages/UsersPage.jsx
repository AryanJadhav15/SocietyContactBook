import { useEffect, useState } from 'react';
import { Shield, UserPlus, Users } from 'lucide-react';
import { api, unwrap } from '../api/client.js';
import Field from '../components/ui/Field.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import { roleLabel, statusTone } from '../utils/format.js';

const empty = { name: '', email: '', password: '', role: 'RESIDENT', status: 'ACTIVE' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    return api
      .get('/users')
      .then((response) => setUsers(unwrap(response)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/users', form);
      setForm(empty);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Unable to create user');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
          User Management
        </h2>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">
          Manage resident accounts and administrative roles across the society.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
        {/* Create User Form Card */}
        <form
          onSubmit={submit}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card overflow-hidden"
        >
          <div className="flex min-h-16 items-center gap-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] text-[var(--color-accent-emphasis)]">
              <UserPlus size={16} />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Create New User
            </h3>
          </div>

          <div className="p-5 space-y-4">
            <ErrorBanner message={error} />

            <Field label="Full Name" required>
              <input
                className="input"
                required
                placeholder="e.g. Priya Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>

            <Field label="Email Address" required>
              <input
                className="input"
                type="email"
                required
                placeholder="e.g. resident@society.org"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>

            <Field label="Temporary Password" required>
              <input
                className="input"
                type="password"
                minLength="10"
                required
                placeholder="Minimum 10 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>

            <Field label="System Role" required>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="RESIDENT">Resident (Directory Access)</option>
                <option value="SOCIETY_ADMIN">Society Admin (Full Management)</option>
              </select>
            </Field>

            <button type="submit" className="btn-primary w-full py-2.5" disabled={saving}>
              {saving ? 'Creating user...' : 'Create User Account'}
            </button>
          </div>
        </form>

        {/* Users List Card */}
        <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card">
          <div className="flex min-h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
                <Users size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Society Accounts
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {users.length} registered users
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                <span>Loading accounts...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-sm text-[var(--color-text-secondary)]">
              No user accounts found.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {users.map((user) => {
                const isAdmin = user.role === 'SOCIETY_ADMIN';
                return (
                  <div
                    key={user.id}
                    className="grid items-center gap-2 px-5 py-3.5 transition-colors hover:bg-[var(--color-surface-hover)]/60 sm:grid-cols-[1.4fr_1fr_100px]"
                  >
                    <div>
                      <p className="font-semibold text-[var(--color-text-primary)]">
                        {user.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{user.email}</p>
                    </div>

                    <div>
                      <span className={`badge ${isAdmin ? 'badge-accent' : 'badge-neutral'}`}>
                        {isAdmin && <Shield size={11} className="mr-0.5" />}
                        {roleLabel(user.role)}
                      </span>
                    </div>

                    <div className="sm:text-right">
                      <span className={`badge ${statusTone(user.status)}`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
