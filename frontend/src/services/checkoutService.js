import api from './api';

const checkoutService = {
  /**
   * Validate the cart against the server database.
   * Returns authoritative prices and identifies any inventory/price changes.
   */
  validateCart: async (items) => {
    try {
      const response = await api.post('/checkout/cart/validate', { items });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check serviceability and delivery fees for a postal code.
   */
  checkDelivery: async (postalCode, subtotal) => {
    try {
      const response = await api.post('/checkout/delivery/check', { postalCode, subtotal });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Validate and apply coupon code.
   */
  applyCoupon: async (couponCode, subtotal) => {
    try {
      const response = await api.post('/checkout/apply-coupon', { code: couponCode, cartTotal: subtotal });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create an order on the server.
   */
  createOrder: async (checkoutData) => {
    try {
      const response = await api.post('/orders', checkoutData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ── Payment API ──────────────────────────────────────────────────────

  /**
   * Initiate a new payment attempt for an order.
   * Returns paymentId, transactionReference, amount, orderNumber.
   */
  initiatePayment: async (orderNumber, paymentMethod = 'upi') => {
    const response = await api.post('/payments/initiate', { orderNumber, paymentMethod });
    return response;
  },

  /**
   * Process payment for an order or payment ID.
   */
  processPayment: async ({ paymentId, orderNumber, paymentMethod = 'upi' }) => {
    const payload = { paymentId, orderNumber, paymentMethod };
    const response = await api.post('/payments/process', payload);
    return response;
  },

  /**
   * Get current payment status for an order.
   */
  getPaymentStatus: async (orderNumber) => {
    const response = await api.get(`/payments/status/${orderNumber}`);
    return response;
  },

  /**
   * Cancel a payment attempt.
   */
  cancelPayment: async (paymentId) => {
    const response = await api.post('/payments/cancel', { paymentId });
    return response;
  },

  /**
   * Retry payment for an order.
   */
  retryPayment: async (orderNumber, paymentMethod = 'upi') => {
    const response = await api.post('/payments/retry', { orderNumber, paymentMethod });
    return response;
  }
};

export default checkoutService;
