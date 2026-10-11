import { useEffect, useState } from 'react';
import { Plus, Save } from 'lucide-react';
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
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  const load = () => api.get('/flats', { params: { pageSize: 100 } }).then((response) => setFlats(unwrap(response).items));
  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await api.post('/flats', form);
      setForm(empty);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Unable to save flat');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {isAdmin && <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Add flat</h2>
        <ErrorBanner message={error} />
        <div className="mt-4 space-y-4">
          <Field label="Building or wing"><input className="input" required value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} /></Field>
          <Field label="Flat number"><input className="input" required value={form.flatNumber} onChange={(e) => setForm({ ...form, flatNumber: e.target.value })} /></Field>
          <Field label="Floor"><input className="input" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} /></Field>
          <button className="btn-primary w-full"><Save size={17} /> Save flat</button>
        </div>
      </form>}
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-ink">Flats</h2>
          {isAdmin && <span className="badge bg-slate-100 text-slate-600"><Plus size={13} /> Managed by admins</span>}
        </div>
        {flats.length === 0 ? <div className="p-5"><EmptyState title="No flats yet" message="Add flats before associating contacts with residents." /></div> : (
          <div className="divide-y divide-slate-100">
            {flats.map((flat) => (
              <div key={flat.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_1fr_120px]">
                <p className="font-semibold text-slate-900">{flat.building}-{flat.flatNumber}</p>
                <p className="text-sm text-slate-500">Floor {flat.floor || 'not set'}</p>
                <span className={`badge ${statusTone(flat.status)}`}>{flat.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
