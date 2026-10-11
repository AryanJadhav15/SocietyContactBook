export const roleLabel = (role) => role === 'SOCIETY_ADMIN' ? 'Society Admin' : 'Resident';
export const statusTone = (status) => status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600';
export const prettyEnum = (value = '') => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
