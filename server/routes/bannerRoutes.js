const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');

// Public route to fetch active new flavour banner
router.get('/new-flavour', bannerController.getActiveBanner);

module.exports = router;
