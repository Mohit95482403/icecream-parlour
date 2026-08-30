import adminApi from '../../utils/adminApi';

const adminDeliveryApi = {
  getDeliveries: (params) => adminApi.get("/deliveries", { params }),
  getDeliveryPersonnel: () => adminApi.get("/deliveries/personnel"),
  addDeliveryPersonnel: (data) => adminApi.post("/deliveries/personnel", data),
  assignDelivery: (id, delivery_partner_id) => adminApi.patch(`/deliveries/${id}/assign`, { delivery_partner_id }),
  updateDeliveryStatus: (id, status, note) => adminApi.patch(`/deliveries/${id}/status`, { status, note })
};

export default adminDeliveryApi;
