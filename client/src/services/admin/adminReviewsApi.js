import adminApi from '../../utils/adminApi';

const adminReviewsApi = {
  getSummary: () => adminApi.get('/reviews/summary'),
  getReviews: (params) => adminApi.get('/reviews', { params }),
  getReviewDetail: (id) => adminApi.get(`/reviews/${id}`),
  approveReview: (id) => adminApi.patch(`/reviews/${id}/approve`),
  rejectReview: (id, adminNote) => adminApi.patch(`/reviews/${id}/reject`, { adminNote }),
  deleteReview: (id) => adminApi.delete(`/reviews/${id}`),
};

export default adminReviewsApi;
