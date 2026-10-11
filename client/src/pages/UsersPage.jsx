import { useEffect, useState } from 'react';
import { api, unwrap } from '../api/client.js';
import Field from '../components/ui/Field.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import { roleLabel, statusTone } from '../utils/format.js';

const empty = { name: '', email: '', password: '', role: 'RESIDENT', status: 'ACTIVE' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const load = () => api.get('/users').then((response) => setUsers(unwrap(response)));
  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      setForm(empty);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Unable to create user');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Create user</h2>
        <ErrorBanner message={error} />
        <div className="mt-4 space-y-4">
          <Field label="Name"><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Temporary password"><input className="input" type="password" minLength="10" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Role"><select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="RESIDENT">Resident</option><option value="SOCIETY_ADMIN">Society Admin</option></select></Field>
          <button className="btn-primary w-full">Create user</button>
        </div>
      </form>
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5"><h2 className="text-lg font-semibold text-ink">Society users</h2></div>
        <div className="divide-y divide-slate-100">
          {users.map((user) => (
            <div key={user.id} className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_1fr_120px]">
              <div><p className="font-semibold text-slate-900">{user.name}</p><p className="text-sm text-slate-500">{user.email}</p></div>
              <p className="text-sm text-slate-600">{roleLabel(user.role)}</p>
              <span className={`badge ${statusTone(user.status)}`}>{user.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
