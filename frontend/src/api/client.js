import axios from 'axios';

// ═══════════════════════════════════════════════════════════════
// MORERAN CHEMIST API Client — connects to Vercel backend over HTTPS
// ═══════════════════════════════════════════════════════════════

const API_BASE_URL = 'https://moreranchemist.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' }
});

// ── Retry logic with exponential backoff ──
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

async function retryRequest(error) {
  const config = error.config;
  if (!config) return Promise.reject(error);

  config.__retryCount = config.__retryCount || 0;

  // Only retry on network errors or 5xx server errors
  const isNetworkError = !error.response;
  const isServerError = error.response?.status >= 500;

  if (config.__retryCount >= MAX_RETRIES || (!isNetworkError && !isServerError)) {
    return Promise.reject(error);
  }

  config.__retryCount += 1;
  const delay = RETRY_DELAY_MS * Math.pow(2, config.__retryCount - 1);

  await new Promise(resolve => setTimeout(resolve, delay));
  return api(config);
}

// ── Request interceptor — attach JWT token ──
api.interceptors.request.use(config => {
  const token = localStorage.getItem('chemiapp-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — handle errors, token refresh, retries ──
api.interceptors.response.use(
  response => response,
  async error => {
    // Network error or server error — retry
    if (!error.response || error.response.status >= 500) {
      try {
        return await retryRequest(error);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    // 401 Unauthorized — try token refresh
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = localStorage.getItem('chemiapp-refresh');
      if (refreshToken) {
        try {
          const { data } = await api.post('/auth/refresh', { refreshToken });
          localStorage.setItem('chemiapp-token', data.token);
          error.config.headers.Authorization = `Bearer ${data.token}`;
          return api(error.config);
        } catch (_) {
          // Refresh failed — fall through to logout
        }
      }
      localStorage.removeItem('chemiapp-token');
      localStorage.removeItem('chemiapp-refresh');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
