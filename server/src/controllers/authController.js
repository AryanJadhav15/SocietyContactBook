import { login, setupInitialAdmin } from '../services/authService.js';
import { clearAuthCookies, setAuthCookies, signSession } from '../middleware/auth.js';

export async function setup(req, res) {
  const result = await setupInitialAdmin({
    setupToken: req.get('x-setup-token'),
    payload: req.validated.body
  });
  res.status(201).json({ success: true, data: result });
}

export async function loginUser(req, res) {
  const user = await login(req.validated.body);
  const session = signSession(user);
  setAuthCookies(res, session);
  res.json({ success: true, data: { user, csrfToken: session.csrf } });
}

export async function logoutUser(_req, res) {
  clearAuthCookies(res);
  res.json({ success: true });
}

export async function currentUser(req, res) {
  res.json({ success: true, data: { user: req.user, csrfToken: req.sessionPayload?.csrf } });
}
