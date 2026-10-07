import api from '../api/axios';

export const favoriteService = {
  addFavorite: async (providerId) => {
    const res = await api.post(`/favorites/${providerId}`);
    return res.data;
  },

  removeFavorite: async (providerId) => {
    const res = await api.delete(`/favorites/${providerId}`);
    return res.data;
  },

  getFavorites: async () => {
    const res = await api.get('/favorites');
    return res.data.data;
  },

  checkIsFavorite: async (providerId) => {
    const res = await api.get(`/favorites/${providerId}/check`);
    return res.data.data;
  },
};
