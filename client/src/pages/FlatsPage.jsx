import { useEffect, useState } from 'react';
import { Building2, Plus, Save } from 'lucide-react';
import { api, unwrap } from '../api/client.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import Field from '../components/ui/Field.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { statusTone } from '../utils/format.js';

const empty = { building: '', flatNumber: '', floor: '', status: 'ACTIVE' };

export default function FlatsPage() {
  const { isAdmin } = useAuth();
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    return api
      .get('/flats', { params: { pageSize: 100 } })
      .then((response) => setFlats(unwrap(response).items))
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
      await api.post('/flats', form);
      setForm(empty);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Unable to save flat');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
          Society Flats
        </h2>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">
          Residential units and apartment listings within the complex.
        </p>
      </div>

      <div className={`grid gap-6 ${isAdmin ? 'lg:grid-cols-[360px_1fr] lg:items-start' : 'grid-cols-1'}`}>
        {/* Admin Add Flat Form */}
        {isAdmin && (
          <form
            onSubmit={submit}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card overflow-hidden"
          >
            <div className="flex min-h-16 items-center gap-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] text-[var(--color-accent-emphasis)]">
                <Plus size={16} />
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">Add New Flat</h3>
            </div>

            <div className="p-5 space-y-4">
              <ErrorBanner message={error} />

              <Field label="Building / Wing" required>
                <input
                  className="input"
                  required
                  placeholder="e.g. Tower A"
                  value={form.building}
                  onChange={(e) => setForm({ ...form, building: e.target.value })}
                />
              </Field>

              <Field label="Flat Number" required>
                <input
                  className="input"
                  required
                  placeholder="e.g. 402"
                  value={form.flatNumber}
                  onChange={(e) => setForm({ ...form, flatNumber: e.target.value })}
                />
              </Field>

              <Field label="Floor Level">
                <input
                  className="input"
                  placeholder="e.g. 4"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                />
              </Field>

              <button type="submit" className="btn-primary w-full py-2.5" disabled={saving}>
                <Save size={16} />
                {saving ? 'Saving...' : 'Register Flat'}
              </button>
            </div>
          </form>
        )}

        {/* Flats List Card */}
        <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card">
          <div className="flex min-h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
                <Building2 size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Registered Units
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {flats.length} total units configured
                </p>
              </div>
            </div>
            {isAdmin && (
              <span className="badge badge-accent">
                Admin Managed
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                <span>Loading units...</span>
              </div>
            </div>
          ) : flats.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No flats registered yet"
                message="Add residential flats before associating service staff and contacts."
              />
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {flats.map((flat) => (
                <div
                  key={flat.id}
                  className="grid items-center gap-2 px-5 py-3.5 transition-colors hover:bg-[var(--color-surface-hover)]/60 sm:grid-cols-[1.2fr_1fr_100px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="badge-code">
                      {flat.building}-{flat.flatNumber}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] sm:text-sm">
                    {flat.floor ? `Floor ${flat.floor}` : 'Floor not specified'}
                  </p>
                  <div className="sm:text-right">
                    <span className={`badge ${statusTone(flat.status)}`}>
                      {flat.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
