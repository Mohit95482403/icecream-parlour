import adminApi from '../../utils/adminApi';

const adminOrderApi = {
  getOrders: (params) => adminApi.get("/orders", { params }),
  getOrderSummary: () => adminApi.get("/orders/summary"),
  getOrderById: (id) => adminApi.get(`/orders/${id}`),
  updateOrderStatus: (id, status, note, processRefund = false) => adminApi.patch(`/orders/${id}/status`, { status, note, processRefund }),
  getEligibleDeliveryPersonnel: () => adminApi.get('/deliveries/personnel'),
  assignDelivery: (id, delivery_partner_id) => adminApi.post(`/orders/${id}/assign-delivery`, { delivery_partner_id }),
  processRefund: (id, reason) => adminApi.post(`/orders/${id}/refund`, { reason }),
  getOrderRefund: (id) => adminApi.get(`/orders/${id}/refund`),
  getCancellationRequests: (params) => adminApi.get('/orders/cancellations/requests', { params }),
  approveCancellation: (id) => adminApi.post(`/orders/cancellations/${id}/approve`),
  rejectCancellation: (id, reason) => adminApi.post(`/orders/cancellations/${id}/reject`, { reason })
};

export default adminOrderApi;
