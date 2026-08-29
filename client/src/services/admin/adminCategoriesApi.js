import adminApi from '../../utils/adminApi';

const adminCategoriesApi = {
  getCategories: () => adminApi.get('/categories'),
  createCategory: (data) => adminApi.post('/categories', data),
  updateCategory: (id, data) => adminApi.patch(`/categories/${id}`, data),
  updateCategoryStatus: (id, status) => adminApi.patch(`/categories/${id}/status`, { status })
};

export default adminCategoriesApi;
