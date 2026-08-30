const db = require('../config/db');
const notificationService = require('./notificationService');

/**
 * GLACÉ Server-Authoritative Internal Refund Service
 * 
 * Manages atomic, idempotent, simulated refund processing.
 * Strictly calculates authoritative refund amounts from payment records.
 */
class RefundService {

  // ── Generate unique refund reference ────────────────────────────────
  generateRefundReference() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REF-${y}${m}${d}-${rand}`;
  }

  // ── Process full refund for an order ────────────────────────────────
  async processRefund({ orderId, adminId = null, reason = 'Order cancelled', externalConnection = null }) {
    const connection = externalConnection || await db.getConnection();
    const shouldManageTransaction = !externalConnection;

    try {
      if (shouldManageTransaction) {
        await connection.beginTransaction();
      }

      // 1. Fetch & lock order
      const [orders] = await connection.query(
        'SELECT id, order_number, user_id, total_amount, gift_card_amount, gift_card_id, payment_status, order_status, cancellation_status FROM orders WHERE id = ? FOR UPDATE',
        [orderId]
      );
      if (orders.length === 0) {
        throw new Error('Order not found');
      }
      const order = orders[0];
      const customerId = order.user_id;

      // 1.5. Restore Gift Card balance if order used a gift card
      if (order.gift_card_id && parseFloat(order.gift_card_amount) > 0) {
        const giftCardService = require('./giftCardService');
        await giftCardService.refundToCard(
          order.gift_card_id,
          order.gift_card_amount,
          order.order_number,
          adminId,
          connection
        );
      }

      // 2. Fetch associated payment
      const [payments] = await connection.query(
        'SELECT id, order_id, transaction_reference, amount, status, refund_reference, refund_amount, refund_status FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1 FOR UPDATE',
        [orderId]
      );

      if (payments.length === 0) {
        throw new Error('No payment record found for this order');
      }
      const payment = payments[0];

      // 3. Check for existing refund record (Duplicate protection / Idempotency)
      const [existingRefunds] = await connection.query(
        'SELECT id, order_id, payment_id, customer_id, amount, status, reason, refund_reference, processed_by, processed_at, created_at FROM refunds WHERE order_id = ? FOR UPDATE',
        [orderId]
      );

      if (existingRefunds.length > 0 && existingRefunds[0].status === 'REFUNDED') {
        const existing = existingRefunds[0];
        if (shouldManageTransaction) await connection.commit();
        return {
          success: true,
          isIdempotent: true,
          message: 'Refund has already been processed for this order.',
          refund: existing,
          payment: {
            status: payment.status,
            refundReference: existing.refund_reference,
            refundAmount: parseFloat(existing.amount),
            refundStatus: 'completed'
          },
          order: {
            orderNumber: order.order_number,
            orderStatus: order.order_status,
            paymentStatus: order.payment_status
          }
        };
      }

      // 4. Validate payment status: ONLY PAID orders can be refunded
      if (payment.status === 'refunded' && existingRefunds.length > 0) {
        const existing = existingRefunds[0];
        if (shouldManageTransaction) await connection.commit();
        return {
          success: true,
          isIdempotent: true,
          message: 'Payment is already refunded.',
          refund: existing
        };
      }

      if (payment.status !== 'paid') {
        throw new Error(`Refund is not allowed. Payment status is '${payment.status}'. Only successfully paid orders can be refunded.`);
      }

      // 5. Authoritative refund amount = actual payment amount (can be 0 if fully paid by gift card)
      const refundAmount = parseFloat(payment.amount) || 0;

      // 6. Generate unique internal refund reference
      let refundReference;
      let attempts = 0;
      while (attempts < 5) {
        refundReference = this.generateRefundReference();
        const [existingRef] = await connection.query(
          'SELECT id FROM refunds WHERE refund_reference = ?',
          [refundReference]
        );
        if (existingRef.length === 0) break;
        attempts++;
      }
      if (attempts >= 5) {
        throw new Error('Failed to generate unique refund reference');
      }

      // 7. Atomic DB operations
      let refundId;
      if (existingRefunds.length > 0) {
        refundId = existingRefunds[0].id;
        await connection.query(
          `UPDATE refunds SET 
             payment_id = ?, 
             customer_id = ?, 
             amount = ?, 
             status = 'REFUNDED', 
             reason = ?, 
             refund_reference = ?, 
             processed_by = ?, 
             processed_at = NOW(), 
             updated_at = NOW() 
           WHERE id = ?`,
          [payment.id, customerId, refundAmount, reason, refundReference, adminId, refundId]
        );
      } else {
        const [insertResult] = await connection.query(
          `INSERT INTO refunds 
             (order_id, payment_id, customer_id, amount, status, reason, refund_reference, processed_by, processed_at) 
           VALUES (?, ?, ?, ?, 'REFUNDED', ?, ?, ?, NOW())`,
          [orderId, payment.id, customerId, refundAmount, reason, refundReference, adminId]
        );
        refundId = insertResult.insertId;
      }

      // Update payment record
      await connection.query(
        `UPDATE payments SET 
           status = 'refunded', 
           refund_reference = ?, 
           refund_amount = ?, 
           refund_status = 'completed', 
           refund_reason = ?, 
           refunded_at = NOW(), 
           updated_at = NOW() 
         WHERE id = ?`,
        [refundReference, refundAmount, reason, payment.id]
      );

      // Update order record
      const nextCancellationStatus = (order.cancellation_status === 'PENDING' || order.cancellation_status === 'APPROVED')
        ? 'APPROVED'
        : 'CANCELLED';

      await connection.query(
        `UPDATE orders SET 
           payment_status = 'refunded', 
           order_status = 'cancelled', 
           cancellation_status = ?, 
           updated_at = NOW() 
         WHERE id = ?`,
        [nextCancellationStatus, orderId]
      );

      // Log payment audit event
      await connection.query(
        `INSERT INTO payment_events (payment_id, event_type, description, metadata) 
         VALUES (?, 'REFUND_COMPLETED', ?, ?)`,
        [
          payment.id,
          `Internal simulated refund of ₹${refundAmount.toFixed(2)} processed (${refundReference})`,
          JSON.stringify({
            refundId,
            orderId,
            orderNumber: order.order_number,
            refundReference,
            refundAmount,
            reason,
            adminId,
            processedAt: new Date().toISOString()
          })
        ]
      );

      // Optional admin audit log
      if (adminId) {
        try {
          await connection.query(
            `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description) 
             VALUES (?, 'ORDER_REFUND', 'order', ?, ?)`,
            [adminId, String(orderId), `Processed refund of ₹${refundAmount} for order #${order.order_number} (${refundReference})`]
          );
        } catch (auditErr) {
          console.warn('Non-blocking audit log insert error:', auditErr.message);
        }
      }

      if (shouldManageTransaction) {
        await connection.commit();
      }

      // 8. Customer Notification (asynchronous / non-blocking)
      if (customerId) {
        try {
          await notificationService.createNotification(
            customerId,
            orderId,
            'REFUND_COMPLETED',
            'Refund Processed',
            `Your refund of ₹${refundAmount.toLocaleString('en-IN')} for order #${order.order_number} has been processed successfully.`,
            {
              orderId,
              orderNumber: order.order_number,
              refundAmount,
              refundReference,
              refundStatus: 'REFUNDED'
            }
          );
        } catch (notifErr) {
          console.error('Failed to create customer refund notification:', notifErr.message);
        }
      }

      return {
        success: true,
        isIdempotent: false,
        message: 'Refund processed successfully.',
        refund: {
          id: refundId,
          orderId,
          paymentId: payment.id,
          amount: refundAmount,
          status: 'REFUNDED',
          refundReference,
          reason,
          processedBy: adminId,
          processedAt: new Date()
        },
        payment: {
          id: payment.id,
          status: 'refunded',
          refundReference,
          refundAmount,
          refundStatus: 'completed'
        },
        order: {
          orderNumber: order.order_number,
          orderStatus: 'cancelled',
          paymentStatus: 'refunded'
        }
      };

    } catch (error) {
      if (shouldManageTransaction) {
        await connection.rollback();
      }
      console.error(`[RefundService] Refund failed for order ${orderId}:`, error);
      throw error;
    } finally {
      if (shouldManageTransaction) {
        connection.release();
      }
    }
  }

  // ── Get refund details for an order ──────────────────────────────────
  async getRefundByOrderId(orderId) {
    const [refunds] = await db.query(
      `SELECT r.*, 
              u.first_name as admin_first_name, u.last_name as admin_last_name,
              p.transaction_reference, p.payment_method
       FROM refunds r
       LEFT JOIN users u ON r.processed_by = u.id
       LEFT JOIN payments p ON r.payment_id = p.id
       WHERE r.order_id = ?
       ORDER BY r.created_at DESC LIMIT 1`,
      [orderId]
    );

    if (refunds.length === 0) return null;
    return refunds[0];
  }
}

module.exports = new RefundService();
