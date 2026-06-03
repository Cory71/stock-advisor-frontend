// AuthContext — holds the current logged-in user and the JWT for the app.
// The JWT lives in localStorage so it survives page refreshes. On first mount,
// if we already have a stored token, ask the backend "who am I?" to hydrate
// the user object.

import { createContext, useContext, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Hydrate the current user from a stored token, exactly once on mount.
  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (!stored) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Stored token was rejected');
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => {
        // Token expired or otherwise invalid — clear it so the user sees a logged-out app.
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Called by the Login and Signup pages after a successful response.
  function login(newToken, newUser) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  }

  // Called by the NavBar's logout button.
  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  const value = { user, token, login, logout, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Convenience hook so pages can just `const { user, login } = useAuth()`.
export function useAuth() {
  return useContext(AuthContext);
}
