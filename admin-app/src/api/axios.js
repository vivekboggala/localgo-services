import axios from 'axios';
import { auth } from '../firebase';

const MAX_WAKE_RETRIES = 3;
const RETRY_DELAYS_MS = [2500, 4500, 6500];

const emitWakeStatus = (waking, attempt = 0) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('localgo:server-waking', {
        detail: { waking, attempt, maxRetries: MAX_WAKE_RETRIES },
      })
    );
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localgo-services-1.onrender.com/',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

api.interceptors.request.use(
  async (config) => {
    if (config.baseURL && !config.baseURL.endsWith('/api') && config.url && !config.url.startsWith('/api')) {
      config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }

    let token = localStorage.getItem('localgo_token');
    if (auth?.currentUser) {
      try {
        token = await auth.currentUser.getIdToken();
        localStorage.setItem('localgo_token', token);
      } catch (e) {
        // Fallback to cached token
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (response.config?.__retryCount) {
      emitWakeStatus(false, 0);
    }
    return response;
  },
  async (error) => {
    const config = error.config || {};
    const method = (config.method || 'get').toLowerCase();
    const status = error.response?.status;
    const isWakeError = !error.response || error.code === 'ECONNABORTED' || status === 502 || status === 503 || status === 504;

    if (method === 'get' && isWakeError && !config.skipWakeRetry) {
      const retryCount = config.__retryCount || 0;
      if (retryCount < MAX_WAKE_RETRIES) {
        config.__retryCount = retryCount + 1;
        emitWakeStatus(true, config.__retryCount);
        await sleep(RETRY_DELAYS_MS[retryCount] || 4000);
        return api(config);
      }
      emitWakeStatus(false, 0);
    }

    if (status === 401) {
      const token = localStorage.getItem('localgo_token');
      if (token) {
        localStorage.removeItem('localgo_token');
        localStorage.removeItem('localgo_user');
        if (!['/login', '/signup', '/verify-email', '/forgot-password'].includes(window.location.pathname)) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
