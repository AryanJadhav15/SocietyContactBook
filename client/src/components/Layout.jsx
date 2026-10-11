import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Building2, Home, LogOut, Menu, Phone, Shield, Users } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { roleLabel } from '../utils/format.js';

const links = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/contacts', label: 'Contacts', icon: Phone },
  { to: '/flats', label: 'Flats', icon: Building2 },
  { to: '/users', label: 'Users', icon: Users, admin: true }
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const title = links.find((item) => item.to === location.pathname)?.label || 'Society Contact Book';

  return (
    <div className="min-h-screen bg-surface">
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-slate-200 bg-white p-4 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link to="/" className="mb-6 flex items-center gap-3 px-2 py-2" onClick={() => setOpen(false)}>
          <span className="grid h-10 w-10 place-items-center rounded-md bg-brand text-white"><Shield size={21} /></span>
          <span>
            <span className="block text-base font-bold text-ink">Society Contact Book</span>
            <span className="block text-xs text-slate-500">Residential directory</span>
          </span>
        </Link>
        <nav className="space-y-1">
          {links.filter((link) => !link.admin || isAdmin).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium focus-ring ${isActive ? 'bg-brand text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <button className="fixed inset-0 z-20 bg-slate-950/30 lg:hidden" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button className="btn-secondary lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={18} /></button>
              <h1 className="text-xl font-semibold text-ink">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">{roleLabel(user?.role)}</p>
              </div>
              <button className="btn-secondary" onClick={logout}><LogOut size={17} /> Logout</button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
