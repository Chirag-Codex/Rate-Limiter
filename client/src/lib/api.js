

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://rate-limiter-jcmd.onrender.com' : 'http://localhost:5000')
).replace(/\/$/, '');

export function apiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

export const API_BASE_URL = BASE_URL;

