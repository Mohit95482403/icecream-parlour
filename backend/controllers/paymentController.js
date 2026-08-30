const db = require('../config/db');
const paymentService = require('../services/paymentService');

const paymentController = {
  /**
   * POST /api/payments/initiate
   * Creates or gets the active payment attempt for an order.
   */
  initiatePayment: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { orderNumber, paymentMethod } = req.body;

      if (!orderNumber) {
        return res.status(400).json({ success: false, error: { message: 'Order number is required' } });
      }

      // Look up order by number
      const [orders] = await db.query('SELECT id FROM orders WHERE order_number = ?', [orderNumber]);
      if (orders.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Order not found' } });
      }

      const result = await paymentService.createPaymentAttempt(orders[0].id, userId, paymentMethod || 'upi');

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Initiate payment error:', error);
      const statusCode = error.message.includes('Unauthorized') ? 403 :
                          error.message.includes('already been paid') ? 400 :
                          error.message.includes('cancelled') ? 400 :
                          error.message.includes('currently being processed') ? 409 :
                          error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ success: false, error: { message: error.message } });
    }
  },

  /**
   * POST /api/payments/process
   * Process a payment attempt with selected method.
   */
  processPayment: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { paymentId, orderNumber, paymentMethod } = req.body;

      let targetPaymentId = paymentId;

      // If orderNumber is provided without paymentId, initiate one first
      if (!targetPaymentId && orderNumber) {
        const [orders] = await db.query('SELECT id FROM orders WHERE order_number = ?', [orderNumber]);
        if (orders.length === 0) {
          return res.status(404).json({ success: false, error: { message: 'Order not found' } });
        }
        const attempt = await paymentService.createPaymentAttempt(orders[0].id, userId, paymentMethod || 'upi');
        if (attempt.isAlreadyPaid) {
          return res.status(200).json({
            success: true,
            data: {
              status: 'paid',
              transactionReference: attempt.transactionReference,
              paymentMethod: attempt.paymentMethod,
              amount: attempt.amount,
              orderNumber: attempt.orderNumber,
              message: 'Payment already completed',
              isIdempotent: true
            }
          });
        }
        targetPaymentId = attempt.paymentId;
      }

      if (!targetPaymentId) {
        return res.status(400).json({ success: false, error: { message: 'Payment ID or Order Number is required' } });
      }

      const result = await paymentService.processPayment(targetPaymentId, paymentMethod || 'upi', userId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Process payment error:', error);
      const statusCode = error.message.includes('Unauthorized') ? 403 :
                          error.message.includes('not found') ? 404 :
                          error.message.includes('already') ? 409 : 400;
      res.status(statusCode).json({ success: false, error: { message: error.message } });
    }
  },

  /**
   * GET /api/payments/status/:orderNumber
   * Get payment status for an order.
   */
  getPaymentStatus: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { orderNumber } = req.params;

      const result = await paymentService.getPaymentStatusByOrder(orderNumber, userId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get payment status error:', error);
      const statusCode = error.message.includes('Unauthorized') ? 403 :
                          error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ success: false, error: { message: error.message } });
    }
  },

  /**
   * POST /api/payments/cancel
   * Cancel a payment attempt.
   */
  cancelPayment: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { paymentId } = req.body;

      if (!paymentId) {
        return res.status(400).json({ success: false, error: { message: 'Payment ID is required' } });
      }

      const result = await paymentService.cancelPayment(paymentId, userId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Cancel payment error:', error);
      const statusCode = error.message.includes('Unauthorized') ? 403 :
                          error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ success: false, error: { message: error.message } });
    }
  },

  /**
   * POST /api/payments/retry
   * Create a new payment attempt for an order with failed payment.
   */
  retryPayment: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { orderNumber, paymentMethod } = req.body;

      if (!orderNumber) {
        return res.status(400).json({ success: false, error: { message: 'Order number is required' } });
      }

      // Look up order
      const [orders] = await db.query('SELECT id, payment_status, order_status FROM orders WHERE order_number = ?', [orderNumber]);
      if (orders.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Order not found' } });
      }

      const order = orders[0];

      if (order.payment_status === 'paid') {
        return res.status(400).json({ success: false, error: { message: 'This order is already paid' } });
      }

      if (order.order_status === 'cancelled') {
        return res.status(400).json({ success: false, error: { message: 'This order has been cancelled' } });
      }

      // Reset order payment_status to pending so a new attempt can proceed
      await db.query('UPDATE orders SET payment_status = "pending", updated_at = NOW() WHERE id = ?', [order.id]);

      // Create new payment attempt
      const result = await paymentService.createPaymentAttempt(order.id, userId, paymentMethod || 'upi');

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Retry payment error:', error);
      const statusCode = error.message.includes('Unauthorized') ? 403 :
                          error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ success: false, error: { message: error.message } });
    }
  }
};

module.exports = paymentController;
