import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Phone, Plus, Users } from 'lucide-react';
import { api, unwrap } from '../api/client.js';

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then((response) => setData(unwrap(response)));
  }, []);

  if (!data) return <div className="text-slate-600">Loading dashboard...</div>;
  const cards = [
    ['Active contacts', data.summary.activeContacts, Phone],
    ['All contacts', data.summary.totalContacts, Users],
    ['Active flats', data.summary.activeFlats, Building2],
    ['Active users', data.summary.activeUsers, Users]
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <section key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <Icon className="text-brand" size={20} />
            </div>
            <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
          </section>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Contacts by category</h2>
          <div className="mt-4 space-y-3">
            {data.contactsByCategory.map((item) => (
              <div key={item.id}>
                <div className="mb-1 flex justify-between text-sm"><span>{item.name}</span><span>{item.count}</span></div>
                <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-accent" style={{ width: `${Math.min(Number(item.count) * 10, 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Recently updated</h2>
            <Link className="btn-primary" to="/contacts/new"><Plus size={17} /> Add</Link>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {data.recentlyUpdated.map((item) => (
              <Link key={item.id} to={`/contacts/${item.id}`} className="block py-3 hover:bg-slate-50">
                <p className="font-medium text-slate-900">{item.personName}</p>
                <p className="text-sm text-slate-500">{item.contactCode} · {item.categoryName}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
