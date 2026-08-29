const express = require('express');
const router = express.Router();
const adminInventoryController = require('../controllers/adminInventoryController');

router.get('/summary', adminInventoryController.getInventorySummary);
router.get('/', adminInventoryController.getInventory);
router.patch('/:variantId/adjust', adminInventoryController.adjustInventory);
router.get('/:variantId/history', adminInventoryController.getInventoryHistory);

module.exports = router;
