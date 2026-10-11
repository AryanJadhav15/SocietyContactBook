import { prisma } from '../config/prisma.js';
import { env, isProduction } from '../config/env.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { HttpError } from '../utils/httpError.js';

export async function setupInitialAdmin({ setupToken, payload }) {
  if (env.SETUP_TOKEN && setupToken !== env.SETUP_TOKEN) {
    throw new HttpError(403, 'Invalid setup token');
  }
  if (!env.SETUP_TOKEN && isProduction) {
    throw new HttpError(500, 'SETUP_TOKEN must be configured in production');
  }

  const adminCount = await prisma.user.count({ where: { role: 'SOCIETY_ADMIN' } });
  if (adminCount > 0) throw new HttpError(409, 'Initial administrator has already been created');

  const passwordHash = await hashPassword(payload.password);
  return prisma.$transaction(async (tx) => {
    const society = await tx.society.upsert({
      where: { code: payload.societyCode.toUpperCase() },
      update: { name: payload.societyName },
      create: { name: payload.societyName, code: payload.societyCode.toUpperCase() }
    });
    const user = await tx.user.create({
      data: {
        societyId: society.id,
        name: payload.name,
        email: payload.email.toLowerCase(),
        passwordHash,
        role: 'SOCIETY_ADMIN',
        status: 'ACTIVE'
      },
      select: { id: true, societyId: true, name: true, email: true, role: true, status: true }
    });
    return { society, user };
  });
}

export async function login({ email, password }) {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), status: 'ACTIVE' }
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  return {
    id: user.id,
    societyId: user.societyId,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  };
}
