import axios from 'axios';
import { auth } from '../firebase';

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
        // use cached token
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
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('localgo_token');
      if (token) {
        localStorage.removeItem('localgo_token');
        localStorage.removeItem('localgo_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/forgot-password') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
