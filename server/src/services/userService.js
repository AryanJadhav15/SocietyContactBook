import { prisma } from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';
import { notFound } from '../utils/httpError.js';

const publicSelect = { id: true, societyId: true, name: true, email: true, role: true, status: true, createdAt: true, updatedAt: true };

export async function listUsers(societyId) {
  return prisma.user.findMany({ where: { societyId }, select: publicSelect, orderBy: { name: 'asc' } });
}

export async function createUser(societyId, data) {
  const passwordHash = await hashPassword(data.password);
  return prisma.user.create({
    data: { societyId, name: data.name, email: data.email.toLowerCase(), passwordHash, role: data.role, status: data.status },
    select: publicSelect
  });
}

export async function updateUser(societyId, id, data) {
  const user = await prisma.user.findFirst({ where: { id, societyId } });
  if (!user) throw notFound('User not found');
  return prisma.user.update({ where: { id }, data, select: publicSelect });
}
