import api from './api';

const orderService = {
  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  getOrderDetails: async (orderNumber) => {
    const response = await api.get(`/orders/${orderNumber}`);
    return response.data;
  },

  getOrderTracking: async (orderNumber) => {
    const response = await api.get(`/orders/${orderNumber}/tracking`);
    return response.data;
  },

  cancelOrder: async (orderNumber, reason) => {
    const response = await api.post(`/orders/${orderNumber}/cancel`, { reason });
    return response.data;
  },

  requestCancellation: async (orderNumber, reason, message) => {
    const response = await api.post(`/orders/${orderNumber}/cancellation-request`, { reason, message });
    return response.data;
  },

  buyAgain: async (orderNumber) => {
    const response = await api.post(`/orders/${orderNumber}/buy-again`);
    return response?.data ? response.data : response;
  },

  reorder: async (orderNumber) => {
    const response = await api.post(`/orders/${orderNumber}/buy-again`);
    return response?.data ? response.data : response;
  }
};

export default orderService;
