const express = require('express');
const router = express.Router();
const adminDeliveryController = require('../controllers/adminDeliveryController');

router.get('/', adminDeliveryController.getDeliveries);
router.get('/personnel', adminDeliveryController.getEligibleDeliveryPersonnel);
router.post('/personnel', adminDeliveryController.addDeliveryPersonnel);
router.patch('/:id/assign', adminDeliveryController.assignDelivery);
router.patch('/:id/status', adminDeliveryController.updateDeliveryStatus);

module.exports = router;
