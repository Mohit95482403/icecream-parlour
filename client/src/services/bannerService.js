import api from './api';

export const bannerService = {
  /**
   * Fetch active New Flavour Banner.
   * Returns banner object or null if inactive/none found.
   */
  getActiveBanner: async () => {
    try {
      const res = await api.get('/banner/new-flavour');
      return res.data || null;
    } catch (error) {
      console.warn('Banner service: unable to load new flavour banner', error);
      return null;
    }
  }
};

export default bannerService;
