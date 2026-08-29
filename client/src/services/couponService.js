import api from './api';

const couponService = {
  getActiveCoupons: () => api.get('/coupons/active'),
};

export default couponService;
