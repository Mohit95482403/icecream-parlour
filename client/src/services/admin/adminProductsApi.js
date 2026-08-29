import adminApi from '../../utils/adminApi';

const adminProductsApi = {
  getProducts: (params) => adminApi.get('/products', { params }),
  getProductById: (id) => adminApi.get(`/products/${id}`),
  createProduct: (data) => adminApi.post('/products', data),
  updateProduct: (id, data) => adminApi.patch(`/products/${id}`, data),
  updateProductStatus: (id, status) => adminApi.patch(`/products/${id}/status`, { status })
};

export default adminProductsApi;
