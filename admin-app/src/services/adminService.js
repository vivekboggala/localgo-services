import api from '../api/axios';

export const adminService = {
  getDashboardStats: async (days = 7) => {
    const res = await api.get(`/admin/dashboard?days=${days}`);
    return res.data.data;
  },
  getAllProviders: async (status = 'ALL', search = '', limit = 15, cursor = null) => {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.set('status', status);
    if (search?.trim()) params.set('search', search.trim());
    params.set('limit', String(limit));
    if (cursor) params.set('cursor', cursor);
    const res = await api.get(`/admin/providers?${params.toString()}`);
    return res.data.data;
  },
  verifyProvider: async (id, status, reason = '') => {
    const res = await api.put(`/admin/providers/${id}/verify`, { status, reason });
    return res.data.data;
  },
  getAllCustomers: async (role = 'ALL', limit = 15, cursor = null) => {
    const params = new URLSearchParams();
    if (role && role !== 'ALL') params.set('role', role);
    params.set('limit', String(limit));
    if (cursor) params.set('cursor', cursor);
    const res = await api.get(`/admin/users?${params.toString()}`);
    return res.data.data;
  },
  getAllBookings: async (status = 'ALL', limit = 15, cursor = null) => {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.set('status', status);
    params.set('limit', String(limit));
    if (cursor) params.set('cursor', cursor);
    const res = await api.get(`/admin/bookings?${params.toString()}`);
    return res.data.data;
  },
  getAllReviews: async (limit = 12, cursor = null) => {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (cursor) params.set('cursor', cursor);
    const res = await api.get(`/admin/reviews?${params.toString()}`);
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
  getUsersTrend: async (days = 7) => {
    const res = await api.get(`/admin/analytics/users-trend?days=${days}`);
    return res.data.data;
  },
  getBookingsBreakdown: async () => {
    const res = await api.get('/admin/analytics/bookings-breakdown');
    return res.data.data;
  },
};
