import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Plus, Search, XCircle } from 'lucide-react';
import { api, unwrap } from '../api/client.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { statusTone } from '../utils/format.js';

export default function ContactDirectoryPage() {
  const { isAdmin } = useAuth();
  const [references, setReferences] = useState({ categories: [], workTypes: [] });
  const [filters, setFilters] = useState({ search: '', categoryId: '', subcategoryId: '', status: '', workTypeId: '' });
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/references').then((response) => setReferences(unwrap(response)));
  }, []);

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    api.get('/contacts', { params }).then((response) => setData(unwrap(response)));
  }, [filters]);

  const selectedCategory = references.categories.find((item) => item.id === Number(filters.categoryId));

  async function deactivate(id) {
    if (!window.confirm('Deactivate this contact?')) return;
    await api.patch(`/contacts/${id}/deactivate`);
    setFilters({ ...filters });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Contact directory</h2>
          <p className="text-sm text-slate-500">Search by name, mobile number, or contact code.</p>
        </div>
        {isAdmin && <Link className="btn-primary" to="/contacts/new"><Plus size={17} /> Add contact</Link>}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input className="input pl-9" placeholder="Name, mobile, or code" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </label>
          <select className="input" value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value, subcategoryId: '' })}>
            <option value="">All categories</option>
            {references.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="input" value={filters.subcategoryId} onChange={(e) => setFilters({ ...filters, subcategoryId: e.target.value })}>
            <option value="">All subcategories</option>
            {(selectedCategory?.subcategories || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button className="btn-secondary" onClick={() => setFilters({ search: '', categoryId: '', subcategoryId: '', status: '', workTypeId: '' })}><XCircle size={17} /> Clear</button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Any status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select className="input" value={filters.workTypeId} onChange={(e) => setFilters({ ...filters, workTypeId: e.target.value })}>
            <option value="">Any work type</option>
            {references.workTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
      </section>

      {!data ? <p>Loading contacts...</p> : data.items.length === 0 ? (
        <EmptyState title="No contacts found" message="Try clearing filters or add a new contact." />
      ) : (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.3fr_1fr_1fr_1fr_120px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 md:grid">
            <span>Name</span><span>Category</span><span>Mobile</span><span>Work types</span><span>Actions</span>
          </div>
          <div className="divide-y divide-slate-100">
            {data.items.map((contact) => (
              <div key={contact.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.3fr_1fr_1fr_1fr_120px] md:items-center">
                <div>
                  <p className="font-semibold text-slate-900">{contact.personName}</p>
                  <p className="text-sm text-slate-500">{contact.contactCode}</p>
                </div>
                <div className="text-sm"><p>{contact.categoryName}</p><p className="text-slate-500">{contact.subcategoryName}</p></div>
                <p className="text-sm">{contact.mobileNumber}</p>
                <div className="space-y-1">
                  <span className={`badge ${statusTone(contact.status)}`}>{contact.status}</span>
                  <p className="text-sm text-slate-500">{contact.workTypes || 'No work type'}</p>
                </div>
                <div className="flex gap-2">
                  <Link className="btn-secondary px-2" to={`/contacts/${contact.id}`} aria-label="View"><Eye size={16} /></Link>
                  {isAdmin && <Link className="btn-secondary px-2" to={`/contacts/${contact.id}/edit`} aria-label="Edit"><Edit size={16} /></Link>}
                  {isAdmin && <button className="btn-secondary px-2" onClick={() => deactivate(contact.id)} aria-label="Deactivate"><XCircle size={16} /></button>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
