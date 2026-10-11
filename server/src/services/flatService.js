import { prisma } from '../config/prisma.js';
import { parsePagination } from '../utils/pagination.js';
import { notFound } from '../utils/httpError.js';

export async function listFlats(societyId, query) {
  const { page, pageSize, offset } = parsePagination(query);
  const where = {
    societyId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { building: { contains: query.search } },
            { flatNumber: { contains: query.search } },
            { floor: { contains: query.search } }
          ]
        }
      : {})
  };
  const [items, total] = await Promise.all([
    prisma.flat.findMany({ where, orderBy: [{ building: 'asc' }, { flatNumber: 'asc' }], skip: offset, take: pageSize }),
    prisma.flat.count({ where })
  ]);
  return { items, page, pageSize, total };
}

export async function createFlat(societyId, data) {
  return prisma.flat.create({ data: { ...data, societyId } });
}

export async function updateFlat(societyId, id, data) {
  const flat = await prisma.flat.findFirst({ where: { id, societyId } });
  if (!flat) throw notFound('Flat not found');
  return prisma.flat.update({ where: { id }, data });
}

export async function getFlatContacts(societyId, id) {
  const flat = await prisma.flat.findFirst({
    where: { id, societyId },
    include: {
      contactAssociations: {
        include: { contact: { include: { category: true, subcategory: true, workTypes: { include: { workType: true } } } } }
      }
    }
  });
  if (!flat) throw notFound('Flat not found');
  return flat;
}
