import { prisma } from '../config/prisma.js';

export async function audit({ societyId, actorUserId, action, entityType, entityId, metadata }) {
  await prisma.auditLog.create({ data: { societyId, actorUserId, action, entityType, entityId, metadata } });
}
