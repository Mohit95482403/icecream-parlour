const express = require('express');
const router = express.Router();
const giftCardController = require('../controllers/giftCardController');
const { protect } = require('../middleware/authMiddleware');

// Customer routes (all protected)
router.post('/purchase', protect, giftCardController.purchaseGiftCard);
router.post('/redeem', protect, giftCardController.redeemCard);
router.get('/my-cards', protect, giftCardController.getMyGiftCards);
router.get('/:id/transactions', protect, giftCardController.getCardTransactions);
router.post('/validate', protect, giftCardController.validateForCheckout);

module.exports = router;
