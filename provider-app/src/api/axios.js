import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach fresh Firebase ID Token
api.interceptors.request.use(
  async (config) => {
    // Ensure /api prefix if baseURL does not end with /api and endpoint path does not start with /api
    if (config.baseURL && !config.baseURL.endsWith('/api') && config.url && !config.url.startsWith('/api')) {
      config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }

    let token = localStorage.getItem('localgo_token');
    if (auth.currentUser) {
      try {
        token = await auth.currentUser.getIdToken();
        localStorage.setItem('localgo_token', token);
      } catch (e) {
        // fallback to cached token
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('localgo_token');
      localStorage.removeItem('localgo_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
