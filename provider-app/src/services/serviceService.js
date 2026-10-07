import api from '../api/axios';

export const serviceService = {
  getAllServices: async () => {
    const res = await api.get('/services');
    return res.data.data;
  },
  getServiceById: async (id) => {
    const res = await api.get(`/services/${id}`);
    return res.data.data;
  },
};
