import axios from 'axios';

// Route all API calls directly to the live Vercel backend
const baseURL = 'https://chemi-app-cvjv.vercel.app/api';

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
          const refreshURL = '/auth/refresh'; // use relative URL so baseURL is prepended
          const { data } = await api.post(refreshURL, { refreshToken });
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
