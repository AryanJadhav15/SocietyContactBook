export function parsePagination(query) {
  const page = Math.max(Number.parseInt(query.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize || '20', 10), 1), 100);
  return { page, pageSize, offset: (page - 1) * pageSize };
}
