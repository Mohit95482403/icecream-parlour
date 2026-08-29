const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/adminMiddleware');

// Admin Auth
router.post('/auth/login', adminController.login);

// Protected Admin Routes
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Products and Categories
router.use('/products', require('./adminProductRoutes'));
router.use('/categories', require('./adminCategoryRoutes'));
router.use('/inventory', require('./adminInventoryRoutes'));
router.use('/orders', require('./adminOrderRoutes'));
router.use('/deliveries', require('./adminDeliveryRoutes'));
router.use('/coupons', require('./adminCouponRoutes'));
router.use('/reviews', require('./adminReviewRoutes'));
router.use('/payments', require('./adminPaymentRoutes'));
router.use('/gift-cards', require('./adminGiftCardRoutes'));
router.use('/banner', require('./adminBannerRoutes'));
router.use('/banners', require('./adminBannerRoutes'));
router.use('/settings', require('./adminSettingsRoutes'));

module.exports = router;
