import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Filter, Plus, Search, Trash2, X } from 'lucide-react';
import { api, unwrap } from '../api/client.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { statusTone } from '../utils/format.js';

export default function ContactDirectoryPage() {
  const { isAdmin } = useAuth();
  const [references, setReferences] = useState({ categories: [], workTypes: [] });
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    subcategoryId: '',
    status: '',
    workTypeId: ''
  });
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/references').then((response) => setReferences(unwrap(response)));
  }, []);

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    api.get('/contacts', { params }).then((response) => setData(unwrap(response)));
  }, [filters]);

  const selectedCategory = references.categories.find(
    (item) => item.id === Number(filters.categoryId)
  );

  async function deactivate(id) {
    if (!window.confirm('Deactivate this contact?')) return;
    await api.patch(`/contacts/${id}/deactivate`);
    setFilters({ ...filters });
  }

  const hasActiveFilters = Boolean(
    filters.search || filters.categoryId || filters.subcategoryId || filters.status || filters.workTypeId
  );

  const resetFilters = () =>
    setFilters({
      search: '',
      categoryId: '',
      subcategoryId: '',
      status: '',
      workTypeId: ''
    });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
            Contact Directory
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">
            Search and manage residential staff, services, and community contacts.
          </p>
        </div>
        {isAdmin && (
          <Link to="/contacts/new" className="btn-primary self-start sm:self-auto">
            <Plus size={16} /> Add contact
          </Link>
        )}
      </div>

      {/* Filter Toolbar Card */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-card sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            <Filter size={14} className="text-[var(--color-accent)]" /> Filter Directory
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              className="text-xs font-semibold text-[var(--color-accent-emphasis)] hover:underline"
              onClick={resetFilters}
            >
              Reset all filters
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
              size={16}
            />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search by name, mobile, or code..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Category Dropdown */}
          <div className="lg:col-span-3">
            <select
              className="input"
              value={filters.categoryId}
              onChange={(e) =>
                setFilters({ ...filters, categoryId: e.target.value, subcategoryId: '' })
              }
              aria-label="Category filter"
            >
              <option value="">All categories</option>
              {references.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Dropdown */}
          <div className="lg:col-span-3">
            <select
              className="input"
              value={filters.subcategoryId}
              onChange={(e) => setFilters({ ...filters, subcategoryId: e.target.value })}
              aria-label="Subcategory filter"
            >
              <option value="">All subcategories</option>
              {(selectedCategory?.subcategories || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Button */}
          <div className="sm:col-span-2 lg:col-span-2">
            <button
              type="button"
              className="btn-secondary w-full"
              title="Clear all filters"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              <X size={15} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <select
              className="input text-xs sm:text-sm"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              aria-label="Status filter"
            >
              <option value="">Any status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <select
              className="input text-xs sm:text-sm"
              value={filters.workTypeId}
              onChange={(e) => setFilters({ ...filters, workTypeId: e.target.value })}
              aria-label="Work type filter"
            >
              <option value="">Any work type</option>
              {references.workTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Directory Table / List */}
      {!data ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            <span>Loading contact records...</span>
          </div>
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState
          title="No contacts found"
          message={
            hasActiveFilters
              ? 'No directory contacts match your search or filter criteria. Try adjusting filters.'
              : 'The contact book is currently empty. Get started by adding a contact.'
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={resetFilters}
              >
                Clear all filters
              </button>
            ) : isAdmin ? (
              <Link to="/contacts/new" className="btn-primary text-xs">
                <Plus size={15} /> Add first contact
              </Link>
            ) : null
          }
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card">
          {/* Table Header (Desktop) */}
          <div className="hidden grid-cols-[1.4fr_1.1fr_1fr_1.1fr_130px] items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] md:grid">
            <span>Contact Details</span>
            <span>Category</span>
            <span>Phone</span>
            <span>Status & Scope</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[var(--color-border)]">
            {data.items.map((contact) => (
              <div
                key={contact.id}
                className="grid gap-3.5 p-4 transition-colors hover:bg-[var(--color-surface-hover)]/70 md:grid-cols-[1.4fr_1.1fr_1fr_1.1fr_130px] md:items-center md:px-5 md:py-3.5"
              >
                {/* Name & Code */}
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {contact.personName}
                  </p>
                  <div className="mt-1">
                    <span className="badge-code text-[11px]">
                      {contact.contactCode}
                    </span>
                  </div>
                </div>

                {/* Category & Subcategory */}
                <div className="text-sm">
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {contact.categoryName}
                  </span>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {contact.subcategoryName || 'General'}
                  </p>
                </div>

                {/* Mobile Number */}
                <div className="text-sm">
                  <span className="font-mono text-[var(--color-text-primary)]">
                    {contact.mobileNumber}
                  </span>
                </div>

                {/* Status & Work types */}
                <div className="space-y-1">
                  <span className={`badge ${statusTone(contact.status)}`}>
                    {contact.status}
                  </span>
                  <p className="line-clamp-1 text-xs text-[var(--color-text-secondary)]">
                    {contact.workTypes || 'No specific type'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 md:justify-end">
                  <Link
                    to={`/contacts/${contact.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                    aria-label={`View ${contact.personName}`}
                    title="View details"
                  >
                    <Eye size={15} />
                  </Link>
                  {isAdmin && (
                    <Link
                      to={`/contacts/${contact.id}/edit`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent-border)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent-emphasis)]"
                      aria-label={`Edit ${contact.personName}`}
                      title="Edit contact"
                    >
                      <Edit size={15} />
                    </Link>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-danger-border)] hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger)]"
                      onClick={() => deactivate(contact.id)}
                      aria-label={`Deactivate ${contact.personName}`}
                      title="Deactivate contact"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer info */}
          <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-xs text-[var(--color-text-secondary)]">
            Showing <span className="font-semibold text-[var(--color-text-primary)]">{data.items.length}</span> contact{data.items.length === 1 ? '' : 's'}
          </div>
        </section>
      )}
    </div>
  );
}
