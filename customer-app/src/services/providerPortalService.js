import api from '../api/axios';

export const providerPortalService = {
  getDashboardStats: async () => {
    const res = await api.get('/provider/dashboard');
    return res.data.data;
  },
  getPendingRequests: async (page = 0, size = 10) => {
    const res = await api.get(`/provider/requests?page=${page}&size=${size}`);
    return res.data.data;
  },
  getBookingById: async (bookingId) => {
    const res = await api.get(`/bookings/${bookingId}`);
    return res.data.data;
  },
  updateBookingStatus: async (bookingId, status, cancellationReason = null, otp = null) => {
    const res = await api.put(`/provider/bookings/${bookingId}/status`, {
      status,
      cancellationReason,
      otp,
    });
    return res.data.data;
  },
  getProviderBookings: async (status = null, page = 0, size = 10) => {
    let url = `/provider/bookings?page=${page}&size=${size}`;
    if (status) url += `&status=${status}`;
    const res = await api.get(url);
    return res.data.data;
  },
  getEarnings: async () => {
    const res = await api.get('/provider/earnings');
    return res.data.data;
  },
  getEarningsTrend: async (days = 7) => {
    const res = await api.get(`/provider/analytics/earnings-trend?days=${days}`);
    return res.data.data;
  },
  toggleAvailability: async (available = null) => {
    const res = await api.put('/provider/availability', available === null ? {} : { available });
    return res.data.data;
  },
  updatePresence: async (online = true, forceOnline = false) => {
    const res = await api.put('/provider/presence', { online, forceOnline });
    return res.data.data;
  },
  getProfile: async () => {
    const res = await api.get('/provider/profile');
    return res.data.data;
  },
  updateProfile: async (profileData) => {
    const res = await api.put('/provider/profile', profileData);
    return res.data.data;
  },
};
