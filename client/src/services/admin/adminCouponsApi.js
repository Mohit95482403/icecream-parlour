import adminApi from '../../utils/adminApi';

const adminCouponsApi = {
  getCoupons: () => adminApi.get('/coupons'),
  createCoupon: (data) => adminApi.post('/coupons', data),
  updateCoupon: (id, data) => adminApi.put(`/coupons/${id}`, data),
  updateCouponStatus: (id, status) => adminApi.patch(`/coupons/${id}/status`, { status }),
  deleteCoupon: (id) => adminApi.delete(`/coupons/${id}`)
};

export default adminCouponsApi;
