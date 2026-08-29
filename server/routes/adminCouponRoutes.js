const express = require('express');
const router = express.Router();
const adminCouponController = require('../controllers/adminCouponController');

router.route('/')
  .get(adminCouponController.getCoupons)
  .post(adminCouponController.createCoupon);

router.route('/:id')
  .put(adminCouponController.updateCoupon)
  .delete(adminCouponController.deleteCoupon);

router.route('/:id/status')
  .patch(adminCouponController.updateCouponStatus);

module.exports = router;
