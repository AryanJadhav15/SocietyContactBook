import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, unwrap } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then((response) => {
        const data = unwrap(response);
        setUser(data.user);
        if (data.csrfToken) localStorage.setItem('csrfToken', data.csrfToken);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = unwrap(await api.post('/auth/login', { email, password }));
    setUser(data.user);
    localStorage.setItem('csrfToken', data.csrfToken);
  }

  async function logout() {
    await api.post('/auth/logout');
    localStorage.removeItem('csrfToken');
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, logout, isAdmin: user?.role === 'SOCIETY_ADMIN' }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
