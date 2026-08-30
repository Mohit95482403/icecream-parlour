const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// Create real order (authenticated only)
router.post('/', protect, orderController.createOrder);

// Get orders (authenticated only)
router.get('/', protect, orderController.getOrders);
router.get('/:orderNumber', protect, orderController.getOrderByNumber);

const invoiceController = require('../controllers/invoiceController');

router.get('/:orderNumber/tracking', protect, orderController.getOrderTracking);
router.post('/:orderNumber/cancel', protect, orderController.cancelOrder);
router.post('/:orderNumber/cancellation-request', protect, orderController.requestCancellation);
router.post('/:orderNumber/buy-again', protect, orderController.buyAgain);
router.post('/:orderNumber/reorder', protect, orderController.buyAgain);
router.get('/:orderNumber/reorder', protect, orderController.reorder);
router.get('/:orderNumber/invoice', protect, invoiceController.downloadInvoice);

module.exports = router;
