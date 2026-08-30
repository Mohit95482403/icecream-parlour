const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const couponController = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');

// Validate cart against server database
router.post('/cart/validate', protect, checkoutController.validateCart);

// Apply coupon to cart
router.post('/apply-coupon', protect, couponController.applyCoupon);

// Check delivery serviceability for a postal code
router.post('/delivery/check', protect, checkoutController.checkDelivery);

// Validate everything and create an order draft
router.post('/orders/prepare', protect, checkoutController.prepareOrder);

module.exports = router;
