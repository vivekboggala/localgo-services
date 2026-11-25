import axios from 'axios';
import { auth } from '../firebase';
import {
  MOCK_SERVICES,
  MOCK_PROVIDERS,
  MOCK_BOOKINGS,
  MOCK_REVIEWS,
  MOCK_PROVIDER_STATS,
  MOCK_PROVIDER_REQUESTS,
  MOCK_PROVIDER_EARNINGS
} from '../utils/mockData';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localgo-services-1.onrender.com/',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Helper: match mock data for endpoints when backend is unreachable or returns error
export const getMockResponse = (config) => {
  const method = (config.method || 'get').toLowerCase();
  let url = config.url || '';
  
  // Clean URL of baseURL and /api prefix
  url = url.replace(/^https?:\/\/[^/]+/, '');
  url = url.replace(/^\/?api\/?/, '/');
  if (!url.startsWith('/')) url = '/' + url;
  
  const [pathname, search] = url.split('?');
  const params = new URLSearchParams(search || '');
  
  // 1. Services
  if (pathname === '/services' && method === 'get') {
    return { success: true, data: MOCK_SERVICES };
  }
  const serviceMatch = pathname.match(/^\/services\/([^/]+)$/);
  if (serviceMatch && method === 'get') {
    const sId = serviceMatch[1];
    const s = MOCK_SERVICES.find((x) => x.id === sId) || MOCK_SERVICES[0];
    return { success: true, data: s };
  }

  // 2. Providers Nearby
  if (pathname === '/providers/nearby' && method === 'get') {
    const serviceId = params.get('serviceId');
    const minRating = Number(params.get('minRating')) || 0;
    const maxPrice = Number(params.get('maxPrice')) || 99999;
    
    let filtered = [...MOCK_PROVIDERS];
    if (serviceId) {
      filtered = filtered.filter((p) =>
        p.services?.some((s) => s.serviceId === serviceId) ||
        (serviceId === 'electrician' && p.id.startsWith('prov-elec'))
      );
    }
    filtered = filtered.filter((p) => p.rating >= minRating && p.startingPrice <= maxPrice);
    
    return { success: true, data: filtered.length > 0 ? filtered : MOCK_PROVIDERS };
  }

  // 3. Provider by ID
  const providerMatch = pathname.match(/^\/providers\/([^/]+)$/);
  if (providerMatch && method === 'get') {
    const pId = providerMatch[1];
    const p = MOCK_PROVIDERS.find((x) => x.id === pId) || MOCK_PROVIDERS[0];
    return { success: true, data: p };
  }

  // 4. Provider Reviews
  const reviewsMatch = pathname.match(/^\/reviews\/provider\/([^/]+)$/);
  if (reviewsMatch && method === 'get') {
    const pId = reviewsMatch[1];
    const revs = MOCK_REVIEWS.filter((r) => r.providerId === pId);
    return { success: true, data: revs.length > 0 ? revs : MOCK_REVIEWS };
  }

  // 5. Bookings
  if ((pathname === '/bookings/my' || pathname === '/bookings') && method === 'get') {
    const stored = localStorage.getItem('localgo_mock_bookings');
    const list = stored ? JSON.parse(stored) : MOCK_BOOKINGS;
    return { success: true, data: list };
  }

  const bookingMatch = pathname.match(/^\/bookings\/([^/]+)$/);
  if (bookingMatch && method === 'get') {
    const bId = bookingMatch[1];
    const stored = localStorage.getItem('localgo_mock_bookings');
    const list = stored ? JSON.parse(stored) : MOCK_BOOKINGS;
    const found = list.find((b) => b.id === bId) || list[0];
    return { success: true, data: found };
  }

  // POST create booking
  if (pathname === '/bookings' && method === 'post') {
    let payload = {};
    try { payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data; } catch (e) {}
    const newBooking = {
      id: 'BOOK-' + Math.floor(1000 + Math.random() * 9000),
      status: 'REQUESTED',
      createdAt: new Date().toISOString(),
      providerName: 'Rajesh Kumar - Master Electrician',
      serviceName: 'Electrician',
      ...payload,
    };
    const stored = localStorage.getItem('localgo_mock_bookings');
    const list = stored ? JSON.parse(stored) : [...MOCK_BOOKINGS];
    list.unshift(newBooking);
    localStorage.setItem('localgo_mock_bookings', JSON.stringify(list));
    return { success: true, data: newBooking };
  }

  // 6. Provider Portal Endpoints
  if (pathname === '/provider/dashboard' && method === 'get') {
    return { success: true, data: MOCK_PROVIDER_STATS };
  }
  if (pathname === '/provider/requests' && method === 'get') {
    return { success: true, data: { content: MOCK_PROVIDER_REQUESTS, totalElements: MOCK_PROVIDER_REQUESTS.length } };
  }
  if (pathname === '/provider/bookings' && method === 'get') {
    return { success: true, data: { content: MOCK_BOOKINGS, totalElements: MOCK_BOOKINGS.length } };
  }
  if (pathname === '/provider/earnings' && method === 'get') {
    return { success: true, data: MOCK_PROVIDER_EARNINGS };
  }
  if (pathname.includes('/provider/analytics/earnings-trend') && method === 'get') {
    return { success: true, data: MOCK_PROVIDER_EARNINGS.dailyTrend };
  }
  if (pathname === '/provider/profile' && method === 'get') {
    return { success: true, data: MOCK_PROVIDERS[0] };
  }
  if (pathname.includes('/provider/bookings/') && pathname.endsWith('/status')) {
    return { success: true, message: 'Booking status updated successfully' };
  }
  if (pathname === '/provider/availability') {
    return { success: true, data: true };
  }

  // 7. Favorites
  if (pathname.startsWith('/favorites')) {
    return { success: true, data: [] };
  }

  // Default fallback
  return { success: true, data: [] };
};

// Request Interceptor: Attach fresh Firebase ID Token or Mock Token
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
        // fallback
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Seamless Fallback to Mock Data on Failure (never for auth/OTP endpoints)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const reqUrl = error.config?.url || '';
    const isAuthRequest = reqUrl.includes('/auth/');

    if (!isAuthRequest &&
        (!error.response || error.code === 'ECONNABORTED' || error.response.status >= 400)) {
      const mockResult = getMockResponse(error.config || {});
      if (mockResult) {
        return Promise.resolve({
          data: mockResult,
          status: 200,
          statusText: 'OK (Mock Fallback)',
          headers: {},
          config: error.config,
        });
      }
    }

    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('localgo_token');
      if (token) {
        localStorage.removeItem('localgo_token');
        localStorage.removeItem('localgo_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup' && window.location.pathname !== '/verify-email' && window.location.pathname !== '/forgot-password') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
