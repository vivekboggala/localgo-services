import api from '../api/axios';

export const reviewService = {
  submitReview: async (bookingId, rating, comment) => {
    const res = await api.post('/reviews', { bookingId, rating, comment });
    return res.data.data;
  },
  getProviderReviews: async (providerId, limit = 20, cursor = null) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    const res = await api.get(`/providers/${providerId}/reviews?${params.toString()}`);
    return res.data.data;
  },
};
