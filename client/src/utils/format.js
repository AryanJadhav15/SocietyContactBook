export const roleLabel = (role) => (role === 'SOCIETY_ADMIN' ? 'Society Admin' : 'Resident');

export const statusTone = (status) =>
  status === 'ACTIVE' ? 'badge-success' : 'badge-neutral';

export const prettyEnum = (value = '') =>
  value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
