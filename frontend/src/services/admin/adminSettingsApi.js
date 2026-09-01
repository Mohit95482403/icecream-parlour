import adminApi from '../../utils/adminApi';

export const adminSettingsApi = {
  getSettings: async () => {
    const res = await adminApi.get('/settings');
    return res.data;
  },
  
  updateSettings: async (settings) => {
    const res = await adminApi.put('/settings', { settings });
    return res.data;
  }
};

export default adminSettingsApi;
