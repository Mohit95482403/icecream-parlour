const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { uploadBanner } = require('../middleware/uploadMiddleware');

// Get banner config + active products for selection
router.get('/', bannerController.getAdminBanner);

// Update banner configuration
router.put('/', bannerController.updateBanner);

// Upload banner image
router.post('/upload', uploadBanner.single('image'), bannerController.uploadMedia);

module.exports = router;
