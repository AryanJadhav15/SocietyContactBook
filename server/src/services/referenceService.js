import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/httpError.js';

export async function listReferenceData(societyId) {
  const [categories, workTypes, services] = await Promise.all([
    prisma.category.findMany({
      where: { societyId },
      orderBy: { name: 'asc' },
      include: { subcategories: { orderBy: { name: 'asc' } } }
    }),
    prisma.workType.findMany({ where: { societyId }, orderBy: { name: 'asc' } }),
    prisma.service.findMany({ where: { societyId }, orderBy: { name: 'asc' } })
  ]);
  return { categories, workTypes, services };
}

export async function assertCategoryPair(societyId, categoryId, subcategoryId) {
  const subcategory = await prisma.subcategory.findFirst({
    where: { id: subcategoryId, categoryId, societyId },
    include: { category: true }
  });
  if (!subcategory) throw new HttpError(400, 'Subcategory must belong to the selected category and society');
  return subcategory;
}

export async function createSubcategory(societyId, categoryId, name) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, societyId } });
  if (!category) throw new HttpError(404, 'Category not found');
  return prisma.subcategory.create({ data: { societyId, categoryId, name, isSystem: false } });
}

export async function createService(societyId, name) {
  return prisma.service.create({ data: { societyId, name, isSystem: false } });
}

export async function createWorkType(societyId, name) {
  return prisma.workType.create({ data: { societyId, name, isSystem: false } });
}
