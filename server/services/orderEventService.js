const db = require('../config/db');
const notificationService = require('./notificationService');
const deliveryEstimateService = require('./deliveryEstimateService');

class OrderEventService {

  // Configuration for status messages (customer-facing)
  getStatusConfig(status) {
    const configs = {
      pending_payment: {
        title: 'Pending Payment',
        message: 'Your order is awaiting payment.',
        notifType: 'ORDER_PENDING_PAYMENT'
      },
      paid: {
        title: 'Payment Confirmed',
        message: 'Your payment was successful.',
        notifType: 'PAYMENT_SUCCESS'
      },
      confirmed: {
        title: 'Order Confirmed',
        message: 'We\'ve received your order and will start preparing it soon.',
        notifType: 'ORDER_CONFIRMED'
      },
      preparing: {
        title: 'Your order is being prepared',
        message: 'Your scoops are being prepared with care.',
        notifType: 'ORDER_PREPARING'
      },
      ready: {
        title: 'Your order is ready',
        message: 'Your order is packed and ready to go.',
        notifType: 'ORDER_READY'
      },
      out_for_delivery: {
        title: 'Your order is on the way',
        message: 'Your order has left our store.',
        notifType: 'ORDER_OUT_FOR_DELIVERY'
      },
      delivered: {
        title: 'Order Delivered',
        message: 'Delivered. We hope every scoop was worth it.',
        notifType: 'ORDER_DELIVERED'
      },
      cancelled: {
        title: 'Order Cancelled',
        message: 'Your order has been cancelled.',
        notifType: 'ORDER_CANCELLED'
      }
    };
    return configs[status] || { title: 'Status Updated', message: 'Your order status was updated.', notifType: 'ORDER_UPDATED' };
  }

  /**
   * Initialize delivery record for an order
   */
  async initializeDelivery(orderId, deliveryMethod) {
    try {
      const { estimatedStart, estimatedEnd } = deliveryEstimateService.calculateEstimate(deliveryMethod);
      await db.query(
        `INSERT IGNORE INTO deliveries (order_id, status)
         VALUES (?, 'pending')`,
        [orderId]
      );
    } catch (error) {
      console.error('Error initializing delivery:', error);
      // We don't throw here to prevent blocking order flow if delivery creation fails non-critically
    }
  }

  /**
   * Handle an order status change: update order, add history, send notification
   */
  async transitionOrderStatus(orderId, orderNumber, customerId, newStatus, changedByType = 'system', changedById = null, note = null) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get current status
      const [orderRows] = await connection.query('SELECT order_status, delivery_method FROM orders WHERE id = ? FOR UPDATE', [orderId]);
      if (!orderRows.length) {
        throw new Error('Order not found');
      }
      
      const previousStatus = orderRows[0].order_status;
      const deliveryMethod = orderRows[0].delivery_method;

      if (previousStatus === newStatus) {
        await connection.commit();
        return; // No change needed
      }

      // 1. Update order status
      await connection.query('UPDATE orders SET order_status = ?, updated_at = NOW() WHERE id = ?', [newStatus, orderId]);

      // 2. Add history record
      await connection.query(
        `INSERT INTO order_status_history (order_id, old_status, new_status, note, changed_by)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, previousStatus, newStatus, note, changedById]
      );

      // 3. Handle specific lifecycle actions (like creating delivery record when confirmed)
      if (newStatus === 'confirmed') {
        // Initialize delivery estimates when order is confirmed
        const { estimatedStart, estimatedEnd } = deliveryEstimateService.calculateEstimate(deliveryMethod);
        await connection.query(
          `INSERT IGNORE INTO deliveries (order_id, status)
           VALUES (?, 'pending')`,
          [orderId]
        );
      } else if (newStatus === 'out_for_delivery') {
         await connection.query(`UPDATE deliveries SET status = 'out_for_delivery', updated_at = NOW() WHERE order_id = ?`, [orderId]);
      } else if (newStatus === 'delivered') {
         await connection.query(`UPDATE deliveries SET status = 'delivered', delivered_at = NOW(), updated_at = NOW() WHERE order_id = ?`, [orderId]);
      } else if (newStatus === 'cancelled') {
         await connection.query(`UPDATE deliveries SET status = 'cancelled', updated_at = NOW() WHERE order_id = ?`, [orderId]);
         
         // Restore stock safely
         const [orderItems] = await connection.query('SELECT variant_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
         for (const item of orderItems) {
           // Lock the row if needed, but simple increment is generally safe
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

      await connection.commit();

      // 4. Create Notification (outside transaction so it doesn't rollback if notification fails)
      try {
        const config = this.getStatusConfig(newStatus);
        // Personalize message with order number
        const title = config.title;
        const message = config.message;
        
        await notificationService.createNotification(
          customerId,
          orderId,
          config.notifType,
          title,
          message,
          { orderNumber, newStatus }
        );
      } catch (notifErr) {
        console.error('Failed to create notification after status change', notifErr);
      }
      
    } catch (error) {
      await connection.rollback();
      console.error('Error transitioning order status:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Validate if customer can cancel an order
   */
  canCustomerCancel(status) {
    const cancellableStatuses = ['pending_payment', 'paid', 'confirmed'];
    return cancellableStatuses.includes(status);
  }
}

module.exports = new OrderEventService();
