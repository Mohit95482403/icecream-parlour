const db = require('../config/db');
const notificationService = require('./notificationService');
const refundService = require('./refundService');

class CancellationService {
  /**
   * Directly cancel a pending order (Customer-initiated).
   */
  async cancelOrderDirectly(orderId, customerId, reason) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Validate order
      const [orders] = await connection.query(
        'SELECT id, user_id, order_status, payment_status, total_amount, order_number FROM orders WHERE id = ? FOR UPDATE',
        [orderId]
      );
      if (orders.length === 0) throw new Error('Order not found');
      
      const order = orders[0];
      if (order.user_id !== customerId) throw new Error('Unauthorized');
      if (order.order_status === 'cancelled') throw new Error('Order is already cancelled');
      if (order.order_status !== 'pending') throw new Error('Only pending orders can be directly cancelled. Please request cancellation instead.');

      // 2. Update order status and delivery status
      await connection.query('UPDATE orders SET order_status = "cancelled", cancellation_status = "CANCELLED", updated_at = NOW() WHERE id = ?', [orderId]);
      await connection.query('UPDATE deliveries SET status = "cancelled", updated_at = NOW() WHERE order_id = ? AND status != "delivered"', [orderId]);
      
      // 3. Create cancellation record
      await connection.query(
        'INSERT INTO order_cancellations (order_id, customer_id, reason, status) VALUES (?, ?, ?, "CANCELLED")',
        [orderId, customerId, reason]
      );

      // 4. Restore Inventory (safely, exactly once upon cancellation)
      await this._restoreInventory(connection, orderId, order.order_number);

      // 5. Handle Refund atomically if paid
      if (order.payment_status === 'paid') {
        await refundService.processRefund({
          orderId,
          adminId: null,
          reason: reason || 'Customer cancelled pending order',
          externalConnection: connection
        });
      }

      // 6. Record status history
      try {
        await connection.query(
          `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, reason) 
           VALUES (?, 'pending', 'cancelled', ?, ?)`,
          [orderId, customerId, reason || 'Customer cancelled pending order']
        );
      } catch (histErr) {
        console.warn('Non-blocking order_status_history error:', histErr.message);
      }

      await connection.commit();

      // Notification for cancellation
      try {
        await notificationService.createNotification(
          customerId,
          orderId,
          'ORDER_CANCELLED',
          'Order Cancelled',
          `Your order #${order.order_number} has been cancelled successfully.`,
          { orderNumber: order.order_number }
        );
      } catch (notifErr) {
        console.warn('Non-blocking notification error:', notifErr.message);
      }
      
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Request cancellation for a confirmed order (Customer-initiated).
   */
  async requestCancellation(orderId, customerId, reason, message) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Validate order
      const [orders] = await connection.query(
        'SELECT id, user_id, order_status, cancellation_status, order_number FROM orders WHERE id = ? FOR UPDATE',
        [orderId]
      );
      if (orders.length === 0) throw new Error('Order not found');
      
      const order = orders[0];
      if (order.user_id !== customerId) throw new Error('Unauthorized');
      if (order.order_status === 'cancelled') throw new Error('Order is already cancelled');
      if (order.cancellation_status === 'PENDING') throw new Error('A cancellation request is already pending for this order');
      if (['preparing', 'ready', 'out_for_delivery', 'delivered'].includes(order.order_status)) {
         throw new Error('This order can no longer be cancelled because preparation has started or it has been dispatched.');
      }
      if (order.order_status !== 'confirmed') throw new Error('Invalid order status for cancellation request');

      // 2. Update order cancellation_status (order_status remains confirmed until approved)
      await connection.query('UPDATE orders SET cancellation_status = "PENDING", updated_at = NOW() WHERE id = ?', [orderId]);
      
      // 3. Create cancellation record
      await connection.query(
        'INSERT INTO order_cancellations (order_id, customer_id, reason, customer_message, status) VALUES (?, ?, ?, ?, "PENDING")',
        [orderId, customerId, reason, message || null]
      );

      await connection.commit();

      // Notification
      try {
        await notificationService.createNotification(
          customerId,
          orderId,
          'CANCELLATION_REQUESTED',
          'Cancellation Requested',
          `Your cancellation request for order #${order.order_number} has been submitted for review.`,
          { orderNumber: order.order_number }
        );
      } catch (notifErr) {
        console.warn('Non-blocking notification error:', notifErr.message);
      }
      
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Admin approves cancellation request.
   * Supports lookup by either cancellation request ID or order ID.
   */
  async approveCancellation(identifier, adminId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Validate request (by cancellation request id OR order_id)
      const [reqs] = await connection.query(
        'SELECT * FROM order_cancellations WHERE (id = ? OR order_id = ?) AND status = "PENDING" ORDER BY id DESC LIMIT 1 FOR UPDATE',
        [identifier, identifier]
      );

      if (reqs.length === 0) {
        const [existing] = await connection.query(
          'SELECT status FROM order_cancellations WHERE (id = ? OR order_id = ?) ORDER BY id DESC LIMIT 1',
          [identifier, identifier]
        );
        if (existing.length > 0) {
          throw new Error(`Cancellation request has already been ${existing[0].status.toLowerCase()}`);
        }
        throw new Error('No pending cancellation request found');
      }

      const req = reqs[0];
      const orderId = req.order_id;

      // 2. Fetch associated order
      const [orders] = await connection.query(
        'SELECT id, user_id, order_status, payment_status, total_amount, order_number FROM orders WHERE id = ? FOR UPDATE',
        [orderId]
      );
      if (orders.length === 0) throw new Error('Associated order not found');
      const order = orders[0];

      if (order.order_status === 'cancelled') {
        await connection.query('UPDATE order_cancellations SET status = "APPROVED", admin_id = ?, approved_at = NOW() WHERE id = ?', [adminId, req.id]);
        await connection.commit();
        return true;
      }

      // 3. Update cancellation request status to APPROVED
      await connection.query(
        'UPDATE order_cancellations SET status = "APPROVED", admin_id = ?, approved_at = NOW() WHERE id = ?',
        [adminId, req.id]
      );

      // 4. Update order and delivery status
      await connection.query(
        'UPDATE orders SET order_status = "cancelled", cancellation_status = "APPROVED", updated_at = NOW() WHERE id = ?',
        [orderId]
      );
      await connection.query(
        'UPDATE deliveries SET status = "cancelled", updated_at = NOW() WHERE order_id = ? AND status != "delivered"',
        [orderId]
      );

      // 5. Restore Inventory (strictly once)
      await this._restoreInventory(connection, orderId, order.order_number);

      // 6. Process Refund atomically if paid
      if (order.payment_status === 'paid') {
        await refundService.processRefund({
          orderId,
          adminId,
          reason: req.reason || 'Admin approved customer cancellation request',
          externalConnection: connection
        });
      }

      // 7. Record status history
      try {
        await connection.query(
          `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, reason) 
           VALUES (?, ?, 'cancelled', ?, ?)`,
          [orderId, order.order_status, adminId, 'Cancellation request approved by admin']
        );
      } catch (histErr) {
        console.warn('Non-blocking order_status_history error:', histErr.message);
      }

      await connection.commit();

      // 8. Notifications
      try {
        await notificationService.createNotification(
          order.user_id,
          orderId,
          'CANCELLATION_APPROVED',
          'Cancellation Approved',
          `Your cancellation request for order #${order.order_number} has been approved and the order is cancelled.${order.payment_status === 'paid' ? ' A full refund has been initiated.' : ''}`,
          { orderNumber: order.order_number, refundProcessed: order.payment_status === 'paid' }
        );
      } catch (notifErr) {
        console.warn('Non-blocking notification error:', notifErr.message);
      }
      
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Admin rejects cancellation request.
   * Supports lookup by either cancellation request ID or order ID.
   */
  async rejectCancellation(identifier, adminId, reason) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Validate request
      const [reqs] = await connection.query(
        'SELECT * FROM order_cancellations WHERE (id = ? OR order_id = ?) AND status = "PENDING" ORDER BY id DESC LIMIT 1 FOR UPDATE',
        [identifier, identifier]
      );

      if (reqs.length === 0) {
        const [existing] = await connection.query(
          'SELECT status FROM order_cancellations WHERE (id = ? OR order_id = ?) ORDER BY id DESC LIMIT 1',
          [identifier, identifier]
        );
        if (existing.length > 0) {
          throw new Error(`Cancellation request has already been ${existing[0].status.toLowerCase()}`);
        }
        throw new Error('No pending cancellation request found');
      }

      const req = reqs[0];
      const orderId = req.order_id;

      const [orders] = await connection.query(
        'SELECT id, user_id, order_number, order_status FROM orders WHERE id = ?',
        [orderId]
      );
      if (orders.length === 0) throw new Error('Associated order not found');
      const order = orders[0];

      // 2. Update request status to REJECTED with reason
      await connection.query(
        'UPDATE order_cancellations SET status = "REJECTED", admin_id = ?, admin_reason = ?, rejected_at = NOW() WHERE id = ?',
        [adminId, reason, req.id]
      );

      // 3. Update order cancellation_status to REJECTED (order_status remains in confirmed state!)
      await connection.query(
        'UPDATE orders SET cancellation_status = "REJECTED", updated_at = NOW() WHERE id = ?',
        [orderId]
      );

      await connection.commit();

      // 4. Notifications
      try {
        await notificationService.createNotification(
          order.user_id,
          orderId,
          'CANCELLATION_REJECTED',
          'Cancellation Request Rejected',
          `Your cancellation request for order #${order.order_number} was rejected. Reason: ${reason}`,
          { orderNumber: order.order_number, reason }
        );
      } catch (notifErr) {
        console.warn('Non-blocking notification error:', notifErr.message);
      }
      
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // --- INTERNAL HELPERS ---

  async _restoreInventory(connection, orderId, orderNumber) {
    const [orderItems] = await connection.query('SELECT variant_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
    for (const item of orderItems) {
      await connection.query(
        'UPDATE inventory SET quantity = quantity + ?, updated_at = NOW() WHERE variant_id = ?',
        [item.quantity, item.variant_id]
      );
      await connection.query(
        `INSERT INTO inventory_transactions 
          (variant_id, type, quantity, reference_type, reference_id, note) 
         VALUES (?, 'return', ?, 'order', ?, ?)`,
        [item.variant_id, item.quantity, orderNumber, `Order cancelled: ${orderNumber}`]
      );
    }
  }
}

module.exports = new CancellationService();
