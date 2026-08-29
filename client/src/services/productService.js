import api from './api';

export const productService = {
  /**
   * Fetch products with dynamic filters
   * @param {Object} filters - Search and filtering parameters
   * @returns {Promise<Object>} Formatted API response
   */
  getProducts: async (filters = {}) => {
    // Remove undefined or empty parameters before sending
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
    );
    
    // Axios transforms our params object into a query string
    return api.get('/products', { params: cleanFilters });
  },

  getProductBySlug: async (slug) => {
    return api.get(`/products/${slug}`);
  },

  getRelatedProducts: async (slug, limit = 4) => {
    return api.get(`/products/${slug}/related`, { params: { limit } });
  }
};
