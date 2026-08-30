import api from './api';

export const categoryService = {
  getCategories: async () => {
    return api.get('/categories');
  }
};
