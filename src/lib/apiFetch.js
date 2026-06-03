// Thin wrapper around fetch that:
//   - prepends the backend base URL (from VITE_API_URL or localhost fallback)
//   - attaches the JWT from localStorage on every request
//   - sends and parses JSON
//   - throws an Error with the server's message on non-2xx so callers can use try/catch

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Parse the body as JSON regardless of status — error responses are JSON too.
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}
