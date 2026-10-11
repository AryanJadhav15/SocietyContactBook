import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env, isProduction } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export function signSession(user) {
  const csrf = crypto.randomBytes(24).toString('hex');
  const token = jwt.sign(
    { sub: user.id, societyId: user.societyId, role: user.role, csrf },
    env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  return { token, csrf };
}

export function setAuthCookies(res, session) {
  res.cookie(env.COOKIE_NAME, session.token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 8 * 60 * 60 * 1000
  });
  res.cookie('csrf_token', session.csrf, {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 8 * 60 * 60 * 1000
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(env.COOKIE_NAME);
  res.clearCookie('csrf_token');
}

export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.[env.COOKIE_NAME];
    if (!token) throw new HttpError(401, 'Authentication required');
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await prisma.user.findFirst({
      where: { id: Number(payload.sub), societyId: payload.societyId, status: 'ACTIVE' },
      select: { id: true, societyId: true, name: true, email: true, role: true, status: true }
    });
    if (!user) throw new HttpError(401, 'Invalid or expired session');
    req.user = user;
    req.sessionPayload = payload;
    next();
  } catch (error) {
    next(error.status ? error : new HttpError(401, 'Invalid or expired session'));
  }
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have permission for this action'));
  next();
};
