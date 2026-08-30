const db = require('../config/db');
const notificationService = require('./notificationService');

/**
 * GLACÉ Internal Payment Service
 * 
 * Server-authoritative self-created payment engine.
 * Fully integrated internal transaction management.
 */
class PaymentService {

  // ── Valid state transitions ──────────────────────────────────────────
  static VALID_TRANSITIONS = {
    pending:    ['processing'],
    processing: ['paid', 'failed', 'cancelled'],
  };

  // ── Normalize payment method identifier ──────────────────────────────
  normalizeMethod(method) {
    if (!method) return 'upi';
    const lower = String(method).toLowerCase().trim();
    if (lower.includes('upi')) return 'upi';
    if (lower.includes('card')) return 'card';
    if (lower.includes('netbanking') || lower.includes('banking')) return 'netbanking';
    if (lower.includes('wallet')) return 'wallet';
    return 'upi';
  }

  // ── Friendly display label ───────────────────────────────────────────
  getMethodLabel(method) {
    const norm = this.normalizeMethod(method);
    switch (norm) {
      case 'upi': return 'UPI';
      case 'card': return 'Credit / Debit Card';
      case 'netbanking': return 'Net Banking';
      case 'wallet': return 'Digital Wallet';
      default: return 'Online Payment';
    }
  }

  // ── Generate unique transaction reference ────────────────────────────
  generateTransactionReference() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-${y}${m}${d}-${rand}`;
  }

  generateRefundReference() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REF-${y}${m}${d}-${rand}`;
  }

  // ── Validate state transition ────────────────────────────────────────
  isValidTransition(fromStatus, toStatus) {
    const allowed = PaymentService.VALID_TRANSITIONS[fromStatus];
    return allowed && allowed.includes(toStatus);
  }

  // ── Log a payment event ──────────────────────────────────────────────
  async logPaymentEvent(connection, paymentId, eventType, description, metadata = null) {
    await connection.query(
      `INSERT INTO payment_events (payment_id, event_type, description, metadata) VALUES (?, ?, ?, ?)`,
      [paymentId, eventType, description, metadata ? JSON.stringify(metadata) : null]
    );
  }

  // ── Create a new payment attempt ─────────────────────────────────────
  async createPaymentAttempt(orderId, userId, paymentMethod = 'upi') {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Fetch and validate order
      const [orders] = await connection.query(
        'SELECT id, order_number, user_id, total_amount, payment_status, order_status FROM orders WHERE id = ? FOR UPDATE',
        [orderId]
      );
      if (orders.length === 0) throw new Error('Order not found');
      const order = orders[0];

      // 2. Verify ownership
      if (order.user_id && order.user_id !== userId) {
        throw new Error('Unauthorized: This order does not belong to you');
      }

      // 3. Check if already paid
      if (order.payment_status === 'paid') {
        const [paidPayments] = await connection.query(
          'SELECT id, transaction_reference, payment_method, amount FROM payments WHERE order_id = ? AND status = "paid" ORDER BY id DESC LIMIT 1',
          [orderId]
        );
        if (paidPayments.length > 0) {
          await connection.commit();
          const p = paidPayments[0];
          return {
            paymentId: p.id,
            transactionReference: p.transaction_reference,
            amount: parseFloat(p.amount),
            orderNumber: order.order_number,
            paymentMethod: p.payment_method,
            currency: 'INR',
            isExisting: true,
            isAlreadyPaid: true
          };
        }
      }

      // 4. Check if order is cancelled
      if (order.order_status === 'cancelled') {
        throw new Error('This order has been cancelled');
      }

      // 5. Check for existing active/processing payment
      const [activePayments] = await connection.query(
        'SELECT id, status, transaction_reference, payment_method FROM payments WHERE order_id = ? AND status IN ("pending", "processing") FOR UPDATE',
        [orderId]
      );

      const normalizedMethod = this.normalizeMethod(paymentMethod);

      if (activePayments.length > 0) {
        const active = activePayments[0];
        // If there's an existing pending payment, update method and return it
        if (active.status === 'pending') {
          await connection.query(
            'UPDATE payments SET payment_method = ?, updated_at = NOW() WHERE id = ?',
            [normalizedMethod, active.id]
          );
          await connection.commit();
          return {
            paymentId: active.id,
            transactionReference: active.transaction_reference,
            amount: parseFloat(order.total_amount),
            orderNumber: order.order_number,
            paymentMethod: normalizedMethod,
            currency: 'INR',
            isExisting: true
          };
        }
        // If processing, reject duplicate
        if (active.status === 'processing') {
          throw new Error('A payment is currently being processed for this order. Please wait.');
        }
      }

      // 6. Generate unique transaction reference
      let transactionRef;
      let attempts = 0;
      while (attempts < 5) {
        transactionRef = this.generateTransactionReference();
        const [existing] = await connection.query(
          'SELECT id FROM payments WHERE transaction_reference = ?',
          [transactionRef]
        );
        if (existing.length === 0) break;
        attempts++;
      }
      if (attempts >= 5) throw new Error('Failed to generate unique transaction reference');

      // 7. Create new payment record
      const [result] = await connection.query(
        `INSERT INTO payments (order_id, gateway, payment_method, transaction_reference, amount, currency, status)
         VALUES (?, 'internal', ?, ?, ?, 'INR', 'pending')`,
        [orderId, normalizedMethod, transactionRef, order.total_amount]
      );
      const paymentId = result.insertId;

      // 8. Log event
      await this.logPaymentEvent(connection, paymentId, 'PAYMENT_CREATED', `Payment initiated for order ${order.order_number}`, {
        orderNumber: order.order_number,
        amount: parseFloat(order.total_amount),
        method: normalizedMethod
      });

      await connection.commit();

      return {
        paymentId,
        transactionReference: transactionRef,
        amount: parseFloat(order.total_amount),
        orderNumber: order.order_number,
        paymentMethod: normalizedMethod,
        currency: 'INR',
        isExisting: false
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ── Process a payment ────────────────────────────────────────────────
  async processPayment(paymentId, paymentMethod, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Fetch payment with lock
      const [payments] = await connection.query(
        'SELECT p.*, o.order_number, o.user_id, o.total_amount, o.payment_status as order_payment_status FROM payments p JOIN orders o ON p.order_id = o.id WHERE p.id = ? FOR UPDATE',
        [paymentId]
      );
      if (payments.length === 0) throw new Error('Payment not found');
      const payment = payments[0];

      // 2. Verify ownership
      if (payment.user_id && payment.user_id !== userId) {
        throw new Error('Unauthorized');
      }

      const normalizedMethod = this.normalizeMethod(paymentMethod || payment.payment_method);

      // 3. Idempotency — if already completed, return existing result
      if (payment.status === 'paid') {
        await connection.commit();
        return {
          status: 'paid',
          transactionReference: payment.transaction_reference,
          paymentMethod: normalizedMethod,
          message: 'Payment already completed',
          isIdempotent: true
        };
      }

      if (payment.status === 'failed' || payment.status === 'cancelled') {
        throw new Error(`This payment attempt has already ${payment.status}. Please try again.`);
      }

      // 4. Validate transition: pending → processing
      if (payment.status === 'pending') {
        await connection.query(
          'UPDATE payments SET status = "processing", payment_method = ?, updated_at = NOW() WHERE id = ?',
          [normalizedMethod, paymentId]
        );
        await this.logPaymentEvent(connection, paymentId, 'PAYMENT_PROCESSING', `Processing payment via ${this.getMethodLabel(normalizedMethod)}`);
      }

      // 5. Complete payment internally
      await connection.query(
        'UPDATE payments SET status = "paid", payment_method = ?, paid_at = NOW(), updated_at = NOW() WHERE id = ?',
        [normalizedMethod, paymentId]
      );
      
      // Update order payment status
      await connection.query(
        'UPDATE orders SET payment_status = "paid", updated_at = NOW() WHERE id = ?',
        [payment.order_id]
      );
      
      await this.logPaymentEvent(connection, paymentId, 'PAYMENT_PAID', `Payment successful via ${this.getMethodLabel(normalizedMethod)}`, {
        method: normalizedMethod,
        amount: parseFloat(payment.amount)
      });

      // Activate any pending purchased gift cards linked to this order
      const giftCardService = require('./giftCardService');
      await giftCardService.activateGiftCardsByOrderId(payment.order_id, connection);

      await connection.commit();

      // Send success notification
      try {
        await notificationService.createNotification(
          payment.user_id,
          payment.order_id,
          'payment_success',
          'Payment Successful',
          `Payment of ₹${parseFloat(payment.amount).toLocaleString('en-IN')} for order #${payment.order_number} was successful.`,
          { orderNumber: payment.order_number, transactionReference: payment.transaction_reference, paymentMethod: normalizedMethod }
        );
      } catch (notifErr) {
        console.error('Failed to create payment success notification:', notifErr);
      }

      return {
        status: 'paid',
        transactionReference: payment.transaction_reference,
        paymentMethod: normalizedMethod,
        amount: parseFloat(payment.amount),
        orderNumber: payment.order_number,
        message: 'Payment successful',
        isIdempotent: false
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ── Cancel a payment attempt ─────────────────────────────────────────
  async cancelPayment(paymentId, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [payments] = await connection.query(
        'SELECT p.*, o.user_id FROM payments p JOIN orders o ON p.order_id = o.id WHERE p.id = ? FOR UPDATE',
        [paymentId]
      );
      if (payments.length === 0) throw new Error('Payment not found');
      const payment = payments[0];

      if (payment.user_id && payment.user_id !== userId) {
        throw new Error('Unauthorized');
      }

      if (payment.status === 'paid') {
        throw new Error('Cannot cancel a completed payment');
      }

      if (payment.status === 'cancelled' || payment.status === 'failed') {
        await connection.commit();
        return { status: payment.status, message: 'Payment already in terminal state' };
      }

      await connection.query(
        'UPDATE payments SET status = "cancelled", failure_reason = "Customer cancelled", updated_at = NOW() WHERE id = ?',
        [paymentId]
      );

      await this.logPaymentEvent(connection, paymentId, 'PAYMENT_CANCELLED', 'Customer cancelled payment');

      await connection.commit();
      return { status: 'cancelled', message: 'Payment cancelled' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ── Fail a payment attempt ───────────────────────────────────────────
  async failPayment(paymentId, reason, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [payments] = await connection.query(
        'SELECT p.*, o.user_id FROM payments p JOIN orders o ON p.order_id = o.id WHERE p.id = ? FOR UPDATE',
        [paymentId]
      );
      if (payments.length === 0) throw new Error('Payment not found');
      const payment = payments[0];

      if (payment.user_id && payment.user_id !== userId) {
        throw new Error('Unauthorized');
      }

      await connection.query(
        'UPDATE payments SET status = "failed", failure_reason = ?, updated_at = NOW() WHERE id = ?',
        [reason || 'Payment failed', paymentId]
      );

      await connection.query(
        'UPDATE orders SET payment_status = "failed", updated_at = NOW() WHERE id = ?',
        [payment.order_id]
      );

      await this.logPaymentEvent(connection, paymentId, 'PAYMENT_FAILED', `Payment failed: ${reason || 'Failed'}`);

      await connection.commit();
      return { status: 'failed', message: reason };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ── Get payment status for an order ──────────────────────────────────
  async getPaymentStatusByOrder(orderNumber, userId) {
    const [orders] = await db.query(
      'SELECT id, user_id, order_number, total_amount, payment_status, order_status FROM orders WHERE order_number = ?',
      [orderNumber]
    );
    if (orders.length === 0) throw new Error('Order not found');
    const order = orders[0];

    if (order.user_id && order.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    // Get latest payment
    const [payments] = await db.query(
      'SELECT id, transaction_reference, payment_method, amount, currency, status, failure_reason, paid_at, refund_reference, refund_status, refunded_at, created_at FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
      [order.id]
    );

    // Get all payment attempts for this order
    const [allPayments] = await db.query(
      'SELECT id, transaction_reference, payment_method, amount, status, failure_reason, created_at, paid_at FROM payments WHERE order_id = ? ORDER BY created_at DESC',
      [order.id]
    );

    return {
      orderNumber: order.order_number,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status,
      totalAmount: parseFloat(order.total_amount),
      currentPayment: payments.length > 0 ? payments[0] : null,
      paymentAttempts: allPayments
    };
  }

  // ── Get payment details for admin ────────────────────────────────────
  async getPaymentDetails(paymentId) {
    const [payments] = await db.query(
      `SELECT p.*, o.order_number, o.order_status, o.total_amount,
              CASE 
                WHEN u.id IS NOT NULL THEN CONCAT(u.first_name, ' ', u.last_name)
                ELSE CONCAT(o.guest_first_name, ' ', o.guest_last_name)
              END as customer_name,
              u.email as customer_email
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       LEFT JOIN users u ON o.user_id = u.id
       WHERE p.id = ?`,
      [paymentId]
    );
    if (payments.length === 0) throw new Error('Payment not found');

    // Get payment events
    const [events] = await db.query(
      'SELECT * FROM payment_events WHERE payment_id = ? ORDER BY created_at ASC',
      [paymentId]
    );

    return {
      ...payments[0],
      events
    };
  }

  // ── Update payment record with refund info ───────────────────────────
  async updatePaymentRefund(connection, orderId, refundAmount, reason) {
    const refundRef = this.generateRefundReference();

    // Find the paid payment for this order
    const [payments] = await connection.query(
      'SELECT id FROM payments WHERE order_id = ? AND status = "paid" ORDER BY paid_at DESC LIMIT 1',
      [orderId]
    );

    if (payments.length > 0) {
      const paymentId = payments[0].id;

      await connection.query(
        `UPDATE payments SET 
           status = "refunded",
           refund_reference = ?, 
           refund_amount = ?, 
           refund_status = "completed", 
           refund_reason = ?,
           refunded_at = NOW(),
           updated_at = NOW()
         WHERE id = ?`,
        [refundRef, refundAmount, reason, paymentId]
      );

      await this.logPaymentEvent(connection, paymentId, 'REFUND_COMPLETED', `Refund of ₹${refundAmount} processed`, {
        refundReference: refundRef,
        refundAmount,
        reason
      });
    }

    return refundRef;
  }
}

module.exports = new PaymentService();
