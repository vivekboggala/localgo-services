import api from '../api/axios';

export const adminService = {
  getDashboardStats: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data.data;
  },
  getAllCustomers: async (page = 0, size = 10) => {
    const res = await api.get(`/admin/users?page=${page}&size=${size}`);
    return res.data.data;
  },
  getAllProviders: async (status = null, page = 0, size = 10) => {
    let url = `/admin/providers?page=${page}&size=${size}`;
    if (status) url += `&status=${status}`;
    const res = await api.get(url);
    return res.data.data;
  },
  verifyProvider: async (id, status) => {
    const res = await api.put(`/admin/providers/${id}/verify?status=${status}`);
    return res.data.data;
  },
  getAllBookings: async (status = null, page = 0, size = 10) => {
    let url = `/admin/bookings?page=${page}&size=${size}`;
    if (status) url += `&status=${status}`;
    const res = await api.get(url);
    return res.data.data;
  },
  createServiceCategory: async (serviceData) => {
    const res = await api.post('/admin/services', serviceData);
    return res.data.data;
  },
  updateServiceCategory: async (id, serviceData) => {
    const res = await api.put(`/admin/services/${id}`, serviceData);
    return res.data.data;
  },
  deactivateServiceCategory: async (id) => {
    const res = await api.delete(`/admin/services/${id}`);
    return res.data.data;
  },
  getAllReviews: async (page = 0, size = 10) => {
    const res = await api.get(`/admin/reviews?page=${page}&size=${size}`);
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
