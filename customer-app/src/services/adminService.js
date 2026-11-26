import api from '../api/axios';

export const adminService = {
  getDashboardStats: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data.data;
  },
  getAllProviders: async (status = 'ALL', search = '') => {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.set('status', status);
    if (search?.trim()) params.set('search', search.trim());
    const qs = params.toString();
    const res = await api.get(`/admin/providers${qs ? `?${qs}` : ''}`);
    return res.data.data;
  },
  verifyProvider: async (id, status, reason = '') => {
    const res = await api.put(`/admin/providers/${id}/verify`, { status, reason });
    return res.data.data;
  },
  getAllCustomers: async () => {
    const res = await api.get('/admin/users');
    return res.data.data;
  },
  getAllBookings: async (status = 'ALL') => {
    const qs = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
    const res = await api.get(`/admin/bookings${qs}`);
    return res.data.data;
  },
  getAllReviews: async () => {
    const res = await api.get('/admin/reviews');
    return res.data.data;
  },
  toggleHideReview: async (id) => {
    const res = await api.put(`/admin/reviews/${id}/hide`);
    return res.data.data;
  },
  getAdminTrends: async (days = 7) => {
    const res = await api.get(`/admin/analytics/trends?days=${days}`);
    return res.data.data;
  },
};
