const express = require('express');
const router = express.Router();
const adminOrderController = require('../controllers/adminOrderController');

router.get('/', adminOrderController.getPayments);
router.get('/:id', adminOrderController.getPaymentDetails);

module.exports = router;
