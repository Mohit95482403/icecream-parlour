import adminApi from '../../utils/adminApi';

const adminUsersApi = {
  getUsers: async (params) => {
    const response = await adminApi.get('/users', { params });
    return response.data;
  },
  
  getUserById: async (id) => {
    const response = await adminApi.get(`/users/${id}`);
    return response.data;
  },

  updateUserStatus: async (id, status) => {
    const response = await adminApi.patch(`/users/${id}/status`, { status });
    return response.data;
  }
};

export default adminUsersApi;
