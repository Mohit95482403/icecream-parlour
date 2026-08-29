const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Public: Get approved reviews for a product (no auth needed)
router.get('/products/:productId', reviewController.getProductReviews);

// Public: Get rating summary for a product (no auth needed)
router.get('/products/:productId/summary', reviewController.getProductSummary);

// Protected: Customer must be logged in
router.get('/my-reviews', protect, reviewController.getMyReviews);
router.get('/products/:productId/eligibility', protect, reviewController.checkEligibility);
router.post('/products/:productId', protect, reviewController.createReview);

module.exports = router;
