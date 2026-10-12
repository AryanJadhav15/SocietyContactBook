import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Building2, Home, LogOut, Menu, Phone, Shield, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { roleLabel } from '../utils/format.js';
import ThemeToggle from './ui/ThemeToggle.jsx';

const links = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/contacts', label: 'Contacts', icon: Phone },
  { to: '/flats', label: 'Flats', icon: Building2 },
  { to: '/users', label: 'Users', icon: Users, admin: true }
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const currentLink = links.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );
  const title = currentLink?.label || 'Society Contact Book';

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar)] transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Branding header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <Link
            to="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
            onClick={() => setOpen(false)}
          >
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] shadow-sm">
              <Shield size={20} strokeWidth={2.2} />
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight text-[var(--color-text-primary)]">
                Society Contact Book
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
                Residential Directory
              </span>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3.5">
          <div className="mb-2 px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
            Navigation
          </div>
          {links
            .filter((link) => !link.admin || isAdmin)
            .map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] font-semibold text-[var(--color-accent-emphasis)] shadow-sm'
                      : 'border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={
                        isActive
                          ? 'text-[var(--color-accent)]'
                          : 'text-[var(--color-text-secondary)] transition-colors group-hover:text-[var(--color-text-primary)]'
                      }
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
        </nav>

        {/* Sidebar Footer: System Status */}
        <div className="border-t border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-[var(--color-text-secondary)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-success)]" />
            </span>
            <span className="font-medium">Directory Online</span>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-col lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md transition-colors">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            {/* Left: Mobile trigger & Page Title */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn-secondary p-2 lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu size={18} />
              </button>
              <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)] sm:text-xl">
                {title}
              </h1>
            </div>

            {/* Right: Theme Toggle, User Info, Logout */}
            <div className="flex items-center gap-2.5 sm:gap-4">
              <ThemeToggle />

              {/* User Identity */}
              <div className="hidden items-center gap-3 border-l border-[var(--color-border)] pl-3 sm:flex">
                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {user?.name || 'Resident'}
                  </p>
                  <p className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                    {roleLabel(user?.role)}
                  </p>
                </div>
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-xs font-bold text-[var(--color-text-primary)]">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Logout Action */}
              <button
                type="button"
                onClick={logout}
                className="btn-secondary text-xs sm:text-sm"
                title="Sign out of your account"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
