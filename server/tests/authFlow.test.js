import { describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { signSession, setAuthCookies, clearAuthCookies, requireAuth } from '../src/middleware/auth.js';
import { requireCsrf } from '../src/middleware/csrf.js';
import { env, isProduction } from '../src/config/env.js';

describe('Authentication Flow & Cookie Options', () => {
  const mockUser = {
    id: 1,
    societyId: 10,
    role: 'SOCIETY_ADMIN',
    name: 'Admin Test',
    email: 'admin@test.com',
    status: 'ACTIVE'
  };

  it('signSession signs a JWT with user attributes and a CSRF token', () => {
    const session = signSession(mockUser);
    expect(session.token).toBeDefined();
    expect(session.csrf).toBeDefined();
    expect(session.csrf).toHaveLength(48); // 24 bytes in hex

    const decoded = jwt.verify(session.token, env.JWT_SECRET);
    expect(decoded.sub).toBe(mockUser.id);
    expect(decoded.societyId).toBe(mockUser.societyId);
    expect(decoded.role).toBe(mockUser.role);
    expect(decoded.csrf).toBe(session.csrf);
  });

  it('setAuthCookies sets cookies with consistent options and path="/"', () => {
    const session = signSession(mockUser);
    const cookiesSet = {};
    const res = {
      cookie: vi.fn((name, value, options) => {
        cookiesSet[name] = { value, options };
      })
    };

    setAuthCookies(res, session);

    expect(res.cookie).toHaveBeenCalledTimes(2);

    // Session cookie
    const sessionCookie = cookiesSet[env.COOKIE_NAME];
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie.value).toBe(session.token);
    expect(sessionCookie.options.httpOnly).toBe(true);
    expect(sessionCookie.options.secure).toBe(isProduction);
    expect(sessionCookie.options.sameSite).toBe(env.COOKIE_SAME_SITE);
    expect(sessionCookie.options.path).toBe('/');
    expect(sessionCookie.options.maxAge).toBe(8 * 60 * 60 * 1000);

    // CSRF cookie
    const csrfCookie = cookiesSet.csrf_token;
    expect(csrfCookie).toBeDefined();
    expect(csrfCookie.value).toBe(session.csrf);
    expect(csrfCookie.options.httpOnly).toBe(false);
    expect(csrfCookie.options.secure).toBe(isProduction);
    expect(csrfCookie.options.sameSite).toBe(env.COOKIE_SAME_SITE);
    expect(csrfCookie.options.path).toBe('/');
  });

  it('clearAuthCookies clears both cookies with matching path and options', () => {
    const cookiesCleared = {};
    const res = {
      clearCookie: vi.fn((name, options) => {
        cookiesCleared[name] = options;
      })
    };

    clearAuthCookies(res);

    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(cookiesCleared[env.COOKIE_NAME]).toBeDefined();
    expect(cookiesCleared[env.COOKIE_NAME].path).toBe('/');
    expect(cookiesCleared[env.COOKIE_NAME].sameSite).toBe(env.COOKIE_SAME_SITE);
    expect(cookiesCleared[env.COOKIE_NAME].secure).toBe(isProduction);
    expect(cookiesCleared.csrf_token.path).toBe('/');
    expect(cookiesCleared.csrf_token.sameSite).toBe(env.COOKIE_SAME_SITE);
  });

  it('requireAuth rejects requests missing the session cookie with 401', async () => {
    const req = { cookies: {} };
    const next = vi.fn();

    await requireAuth(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.status).toBe(401);
    expect(err.message).toBe('Authentication required');
  });

  it('requireAuth rejects invalid JWT tokens with 401', async () => {
    const req = { cookies: { [env.COOKIE_NAME]: 'invalid.jwt.token' } };
    const next = vi.fn();

    await requireAuth(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.status).toBe(401);
    expect(err.message).toBe('Invalid or expired session');
  });
});

describe('CSRF Middleware Behavior', () => {
  it('allows safe methods (GET, HEAD, OPTIONS) without CSRF token', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      const req = { method, cookies: {}, get: () => undefined };
      const next = vi.fn();
      requireCsrf(req, {}, next);
      expect(next).toHaveBeenCalledWith();
    }
  });

  it('allows unauthenticated mutation requests (e.g. login, setup before cookie exists)', () => {
    const req = { method: 'POST', cookies: {}, get: () => undefined };
    const next = vi.fn();
    requireCsrf(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks authenticated mutation requests when x-csrf-token header is missing', () => {
    const session = signSession({ id: 1, societyId: 10, role: 'RESIDENT' });
    const req = {
      method: 'POST',
      cookies: {
        [env.COOKIE_NAME]: session.token,
        csrf_token: session.csrf
      },
      get: () => undefined // no header
    };
    const next = vi.fn();

    requireCsrf(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.status).toBe(403);
    expect(err.message).toBe('Invalid CSRF token');
  });

  it('blocks authenticated mutation requests when header and cookie token mismatch', () => {
    const session = signSession({ id: 1, societyId: 10, role: 'RESIDENT' });
    const req = {
      method: 'POST',
      cookies: {
        [env.COOKIE_NAME]: session.token,
        csrf_token: session.csrf
      },
      get: (header) => (header.toLowerCase() === 'x-csrf-token' ? 'different-token' : undefined)
    };
    const next = vi.fn();

    requireCsrf(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.status).toBe(403);
    expect(err.message).toBe('Invalid CSRF token');
  });

  it('allows authenticated mutation requests when header, cookie, and JWT csrf match', () => {
    const session = signSession({ id: 1, societyId: 10, role: 'RESIDENT' });
    const req = {
      method: 'POST',
      cookies: {
        [env.COOKIE_NAME]: session.token,
        csrf_token: session.csrf
      },
      get: (header) => (header.toLowerCase() === 'x-csrf-token' ? session.csrf : undefined)
    };
    const next = vi.fn();

    requireCsrf(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });
});
