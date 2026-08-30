import api from './api';

const notificationService = {
  getNotifications: async (page = 1, limit = 20) => {
    return await api.get(`/notifications?page=${page}&limit=${limit}`);
  },

  getUnreadCount: async () => {
    return await api.get('/notifications/unread-count');
  },

  markAsRead: async (id) => {
    return await api.post(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    return await api.post('/notifications/mark-all-read');
  }
};

export default notificationService;
