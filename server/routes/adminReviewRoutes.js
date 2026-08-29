const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// All routes are already protected by requireAdmin in adminRoutes.js

router.get('/summary', reviewController.adminGetSummary);
router.get('/', reviewController.adminGetReviews);
router.get('/:id', reviewController.adminGetReviewDetail);
router.patch('/:id/approve', reviewController.adminApproveReview);
router.patch('/:id/reject', reviewController.adminRejectReview);
router.delete('/:id', reviewController.adminDeleteReview);

module.exports = router;
