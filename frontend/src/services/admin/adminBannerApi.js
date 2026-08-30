import api from '../api';

export const adminBannerApi = {
  /**
   * Fetch admin banner config and product catalog for dropdown.
   */
  getBanner: async () => {
    const res = await api.get('/admin/banner');
    return res.data;
  },

  /**
   * Update banner configuration.
   */
  updateBanner: async (data) => {
    const res = await api.put('/admin/banner', data);
    return res;
  },

  /**
   * Upload image file for banner.
   */
  uploadMedia: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/admin/banner/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  }
};

export default adminBannerApi;
