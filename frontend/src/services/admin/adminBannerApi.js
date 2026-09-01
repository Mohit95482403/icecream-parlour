import adminApi from '../../utils/adminApi';

export const adminBannerApi = {
  /**
   * Fetch admin banner config and product catalog for dropdown.
   */
  getBanner: async () => {
    const res = await adminApi.get('/banner');
    return res.data?.data || res.data;
  },

  /**
   * Update banner configuration.
   */
  updateBanner: async (data) => {
    const res = await adminApi.put('/banner', data);
    return res.data?.data || res.data;
  },

  /**
   * Upload image file for banner.
   */
  uploadMedia: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await adminApi.post('/banner/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data?.data || res.data;
  }
};

export default adminBannerApi;
