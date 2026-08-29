import api from '../api';

export const adminSettingsApi = {
  getSettings: async () => {
    return await api.get('/admin/settings');
  },
  
  updateSettings: async (settings) => {
    return await api.put('/admin/settings', { settings });
  }
};
