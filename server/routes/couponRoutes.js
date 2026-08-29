const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

router.get('/active', couponController.getActiveCoupons);

module.exports = router;
