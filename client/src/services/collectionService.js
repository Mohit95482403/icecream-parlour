import api from './api';

export const collectionService = {
  getCollections: async () => {
    return api.get('/collections');
  }
};
