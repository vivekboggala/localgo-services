import api from '../api/axios';

export const notificationService = {
  getNotifications: async (page = 0, size = 20) => {
    const res = await api.get(`/notifications?page=${page}&size=${size}`);
    return res.data.data;
  },
  getUnreadCount: async () => {
    const res = await api.get('/notifications/unread-count');
    return res.data.data;
  },
  markAsRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data.data;
  },
  markAllAsRead: async () => {
    const res = await api.put('/notifications/read-all');
    return res.data.data;
  },
};
