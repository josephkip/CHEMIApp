import axios from 'axios';

// Detect if running inside Electron desktop app
const isDesktop = window.electronAPI?.isDesktop;

// In Electron, the frontend is loaded from file:// so we need absolute URL
// In dev/web mode, Vite proxy handles /api -> localhost:5000
const baseURL = isDesktop ? 'http://localhost:5000/api' : '/api';

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('chemiapp-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = localStorage.getItem('chemiapp-refresh');
      if (refreshToken) {
        try {
          const refreshURL = isDesktop ? 'http://localhost:5000/api/auth/refresh' : '/api/auth/refresh';
          const { data } = await axios.post(refreshURL, { refreshToken });
          localStorage.setItem('chemiapp-token', data.token);
          error.config.headers.Authorization = `Bearer ${data.token}`;
          return api(error.config);
        } catch { /* fall through to reject */ }
      }
      localStorage.removeItem('chemiapp-token');
      localStorage.removeItem('chemiapp-refresh');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
