const reviewService = require('../services/reviewService');

const reviewController = {

  /**
   * GET /api/reviews/products/:productId/eligibility
   * Check if logged-in customer can review this product.
   */
  checkEligibility: async (req, res) => {
    try {
      const userId = req.user.sub;
      const productId = parseInt(req.params.productId);
      const result = await reviewService.checkEligibility(userId, productId);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Review eligibility error:', error);
      res.status(error.statusCode || 500).json({ success: false, error: { message: error.message } });
    }
  },

  /**
   * POST /api/reviews/products/:productId
   * Submit a new review.
   */
  createReview: async (req, res) => {
    try {
      const userId = req.user.sub;
      const productId = parseInt(req.params.productId);
      const { orderId, rating, title, comment } = req.body;
      const result = await reviewService.createReview(userId, productId, { orderId, rating, title, comment });
      res.status(201).json({ success: true, data: result, message: 'Review submitted successfully and is awaiting approval.' });
    } catch (error) {
      console.error('Create review error:', error);
      res.status(error.statusCode || 500).json({ success: false, error: { message: error.message } });
    }
  },

  /**
   * GET /api/reviews/products/:productId
   * Get approved reviews for a product (public, paginated).
   */
  getProductReviews: async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await reviewService.getApprovedReviews(productId, page, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Get product reviews error:', error);
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  },

  /**
   * GET /api/reviews/products/:productId/summary
   * Get rating summary and distribution.
   */
  getProductSummary: async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const result = await reviewService.getProductRatingSummary(productId);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Get product summary error:', error);
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  },

  /**
   * GET /api/reviews/my-reviews
   * Get logged-in customer's own reviews.
   */
  getMyReviews: async (req, res) => {
    try {
      const userId = req.user.sub;
      const statusFilter = req.query.status || 'all';
      const reviews = await reviewService.getUserReviews(userId, statusFilter);
      res.json({ success: true, data: reviews });
    } catch (error) {
      console.error('Get my reviews error:', error);
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  },

  // ── Admin Endpoints ──

  /**
   * GET /admin/reviews/summary
   */
  adminGetSummary: async (req, res) => {
    try {
      const summary = await reviewService.getAdminSummary();
      res.json({ success: true, data: summary });
    } catch (error) {
      console.error('Admin summary error:', error);
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  },

  /**
   * GET /admin/reviews
   */
  adminGetReviews: async (req, res) => {
    try {
      const { status, rating, search, page, limit } = req.query;
      const result = await reviewService.getAdminReviews({
        status, rating, search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Admin get reviews error:', error);
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  },

  /**
   * GET /admin/reviews/:id
   */
  adminGetReviewDetail: async (req, res) => {
    try {
      const review = await reviewService.getAdminReviewDetail(req.params.id);
      if (!review) {
        return res.status(404).json({ success: false, error: { message: 'Review not found.' } });
      }
      res.json({ success: true, data: review });
    } catch (error) {
      console.error('Admin review detail error:', error);
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  },

  /**
   * PATCH /admin/reviews/:id/approve
   */
  adminApproveReview: async (req, res) => {
    try {
      await reviewService.approveReview(req.params.id);
      res.json({ success: true, message: 'Review approved.' });
    } catch (error) {
      console.error('Admin approve error:', error);
      res.status(error.statusCode || 500).json({ success: false, error: { message: error.message } });
    }
  },

  /**
   * PATCH /admin/reviews/:id/reject
   */
  adminRejectReview: async (req, res) => {
    try {
      const { adminNote } = req.body;
      await reviewService.rejectReview(req.params.id, adminNote || null);
      res.json({ success: true, message: 'Review rejected.' });
    } catch (error) {
      console.error('Admin reject error:', error);
      res.status(error.statusCode || 500).json({ success: false, error: { message: error.message } });
    }
  },

  /**
   * DELETE /admin/reviews/:id
   */
  adminDeleteReview: async (req, res) => {
    try {
      await reviewService.deleteReview(req.params.id);
      res.json({ success: true, message: 'Review deleted.' });
    } catch (error) {
      console.error('Admin delete error:', error);
      res.status(error.statusCode || 500).json({ success: false, error: { message: error.message } });
    }
  },
};

module.exports = reviewController;
