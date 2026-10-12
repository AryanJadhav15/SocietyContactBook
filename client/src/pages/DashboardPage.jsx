import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight, Phone, Plus, Users } from 'lucide-react';
import { api, unwrap } from '../api/client.js';

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then((response) => setData(unwrap(response)));
  }, []);

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-72 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
          <div className="h-72 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Active contacts',
      value: data.summary.activeContacts,
      icon: Phone,
      iconClass: 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-emphasis)] border-[var(--color-accent-border)]'
    },
    {
      label: 'All contacts',
      value: data.summary.totalContacts,
      icon: Users,
      iconClass: 'bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] border-[var(--color-border)]'
    },
    {
      label: 'Active flats',
      value: data.summary.activeFlats,
      icon: Building2,
      iconClass: 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-emphasis)] border-[var(--color-accent-border)]'
    },
    {
      label: 'Active users',
      value: data.summary.activeUsers,
      icon: Users,
      iconClass: 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 4 Key Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, iconClass }) => (
          <section
            key={label}
            className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card transition-all duration-150 hover:border-[var(--color-accent)]/50"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                {label}
              </p>
              <div
                className={`grid h-9 w-9 place-items-center rounded-lg border ${iconClass} transition-transform duration-150 group-hover:scale-105`}
              >
                <Icon size={18} strokeWidth={2.2} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
              {value}
            </p>
          </section>
        ))}
      </div>

      {/* Main Grid: Categories & Recent Contacts */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Contacts By Category */}
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Contacts by category
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Directory distribution by service group
              </p>
            </div>
            <span className="badge badge-neutral">
              {data.contactsByCategory.length} categories
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {data.contactsByCategory.length === 0 ? (
              <p className="py-4 text-sm text-[var(--color-text-secondary)]">No categories found.</p>
            ) : (
              data.contactsByCategory.map((item) => {
                const countNum = Number(item.count) || 0;
                const percentage = Math.min(countNum * 10, 100);

                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {item.name}
                      </span>
                      <span className="font-semibold text-[var(--color-text-secondary)]">
                        {countNum}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Recently Updated */}
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Recently updated
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Latest directory changes
              </p>
            </div>
            <Link to="/contacts/new" className="btn-primary text-xs">
              <Plus size={15} /> Add
            </Link>
          </div>

          <div className="mt-3 divide-y divide-[var(--color-border)]">
            {data.recentlyUpdated.length === 0 ? (
              <p className="py-6 text-sm text-[var(--color-text-secondary)]">
                No recent contacts found.
              </p>
            ) : (
              data.recentlyUpdated.map((item) => {
                const initials = (item.personName || 'C')
                  .split(' ')
                  .map((p) => p[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <Link
                    key={item.id}
                    to={`/contacts/${item.id}`}
                    className="group -mx-2 flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-[var(--color-surface-hover)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-xs font-bold text-[var(--color-text-primary)] group-hover:border-[var(--color-accent)]/50 group-hover:text-[var(--color-accent-emphasis)]">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-emphasis)]">
                          {item.personName}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                          <span className="font-mono">{item.contactCode}</span>
                          <span>·</span>
                          <span className="badge badge-accent">
                            {item.categoryName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-[var(--color-text-secondary)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-accent-emphasis)]"
                    />
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
