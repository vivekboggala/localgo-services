import api from '../api/axios';

export const bookingService = {
  createBooking: async (bookingData) => {
    const res = await api.post('/bookings', bookingData);
    return res.data.data;
  },
  getMyBookings: async (status = null, page = 0, size = 10) => {
    let url = `/bookings/my?page=${page}&size=${size}`;
    if (status) {
      url += `&status=${status}`;
    }
    const res = await api.get(url);
    return res.data.data;
  },
  getBookingById: async (id) => {
    const res = await api.get(`/bookings/${id}`);
    return res.data.data;
  },
  cancelBooking: async (id, reason = '') => {
    const res = await api.put(`/bookings/${id}/cancel?reason=${encodeURIComponent(reason)}`);
    return res.data.data;
  },
};
