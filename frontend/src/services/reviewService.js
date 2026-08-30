import api from './api';

const reviewService = {
  getProductReviews: (productId, page = 1, limit = 10) =>
    api.get(`/reviews/products/${productId}`, { params: { page, limit } }),

  getProductSummary: (productId) =>
    api.get(`/reviews/products/${productId}/summary`),

  checkEligibility: (productId) =>
    api.get(`/reviews/products/${productId}/eligibility`),

  submitReview: (productId, data) =>
    api.post(`/reviews/products/${productId}`, data),

  getMyReviews: (status = 'all') =>
    api.get('/reviews/my-reviews', { params: { status } }),
};

export default reviewService;
