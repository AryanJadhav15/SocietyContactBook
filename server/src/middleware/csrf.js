import { HttpError } from '../utils/httpError.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireCsrf(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const authCookie = req.cookies?.[env.COOKIE_NAME];
  if (!authCookie) return next();

  const headerToken = req.get('x-csrf-token');
  const cookieToken = req.cookies?.csrf_token;
  const sessionToken = req.sessionPayload?.csrf || jwt.verify(authCookie, env.JWT_SECRET).csrf;

  if (!headerToken || !cookieToken || headerToken !== cookieToken || headerToken !== sessionToken) {
    return next(new HttpError(403, 'Invalid CSRF token'));
  }
  next();
}
