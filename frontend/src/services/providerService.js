import api from '../api/axios';

export const providerService = {
  getNearbyProviders: async (latitude, longitude, radius = 10, serviceId = null, minRating = null, maxPrice = null, available = null, sortBy = null) => {
    let url = `/providers/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
    if (serviceId) url += `&serviceId=${serviceId}`;
    if (minRating) url += `&minRating=${minRating}`;
    if (maxPrice) url += `&maxPrice=${maxPrice}`;
    if (available) url += `&available=${available}`;
    if (sortBy) url += `&sortBy=${sortBy}`;
    const res = await api.get(url);
    return res.data.data;
  },
  getProviderById: async (id, latitude = null, longitude = null) => {
    let url = `/providers/${id}`;
    if (latitude && longitude) {
      url += `?latitude=${latitude}&longitude=${longitude}`;
    }
    const res = await api.get(url);
    return res.data.data;
  },
};
