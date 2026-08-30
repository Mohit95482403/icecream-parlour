const express = require('express');
const router = express.Router();
const adminGiftCardController = require('../controllers/adminGiftCardController');

// All routes here are automatically protected by adminRoutes requireAdmin middleware
router.get('/', adminGiftCardController.listGiftCards);
router.post('/issue', adminGiftCardController.issueGiftCard);
router.get('/:id', adminGiftCardController.getGiftCard);
router.put('/:id/suspend', adminGiftCardController.suspendGiftCard);
router.put('/:id/activate', adminGiftCardController.activateGiftCard);
router.post('/:id/adjust', adminGiftCardController.adjustBalance);
router.delete('/:id', adminGiftCardController.deleteGiftCard);

module.exports = router;
