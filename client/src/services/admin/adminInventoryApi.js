import adminApi from '../../utils/adminApi';

const adminInventoryApi = {
  getSummary: () => adminApi.get('/inventory/summary'),
  getInventory: (params) => adminApi.get('/inventory', { params }),
  adjustStock: (variantId, data) => adminApi.patch(`/inventory/${variantId}/adjust`, data),
  getHistory: (variantId, params) => adminApi.get(`/inventory/${variantId}/history`, { params })
};

export default adminInventoryApi;
