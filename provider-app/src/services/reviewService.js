import api from '../api/axios';

export const reviewService = {
  submitReview: async (bookingId, rating, comment) => {
    const res = await api.post('/reviews', { bookingId, rating, comment });
    return res.data.data;
  },
  getProviderReviews: async (providerId, page = 0, size = 10) => {
    const res = await api.get(`/providers/${providerId}/reviews?page=${page}&size=${size}`);
    return res.data.data;
  },
};
