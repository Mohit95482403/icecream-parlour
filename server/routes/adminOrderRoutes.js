const express = require('express');
const router = express.Router();
const adminOrderController = require('../controllers/adminOrderController');
const invoiceController = require('../controllers/invoiceController');

router.get('/', adminOrderController.getOrders);
router.get('/summary', adminOrderController.getOrderSummary);

// Cancellation endpoints
router.get('/cancellations/requests', adminOrderController.getCancellationRequests);
router.post('/cancellations/:id/approve', adminOrderController.approveCancellation);
router.post('/cancellations/:id/reject', adminOrderController.rejectCancellation);

// Refund endpoints
router.post('/:id/refund', adminOrderController.processRefund);
router.get('/:id/refund', adminOrderController.getOrderRefund);

router.get('/:id', adminOrderController.getOrderById);
router.patch('/:id/status', adminOrderController.updateOrderStatus);
router.post('/:id/assign-delivery', adminOrderController.assignDelivery);
router.get('/number/:orderNumber/invoice', invoiceController.downloadInvoiceAdmin);

module.exports = router;
