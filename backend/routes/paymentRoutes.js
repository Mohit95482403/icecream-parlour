const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// All payment routes require authentication
router.post('/initiate', protect, paymentController.initiatePayment);
router.post('/process', protect, paymentController.processPayment);
router.get('/status/:orderNumber', protect, paymentController.getPaymentStatus);
router.post('/cancel', protect, paymentController.cancelPayment);
router.post('/retry', protect, paymentController.retryPayment);

module.exports = router;
