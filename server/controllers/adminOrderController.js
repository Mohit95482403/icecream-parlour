const db = require('../config/db');
const orderEventService = require('../services/orderEventService');
const cancellationService = require('../services/cancellationService');
const refundService = require('../services/refundService');

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', payment = '', delivery = '', sort = 'newest', gift_type = 'all' } = req.query;
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let baseQuery = `
      SELECT o.id, o.order_number, o.guest_first_name, o.guest_last_name, o.guest_email, o.guest_phone,
             o.total_amount, o.payment_status, o.order_status, o.cancellation_status, o.created_at,
             o.is_gift_order, o.gift_recipient_name,
             d.status as delivery_status,
             (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) as total_items,
             CASE 
               WHEN u.id IS NOT NULL THEN CONCAT(u.first_name, ' ', u.last_name)
               ELSE CONCAT(o.guest_first_name, ' ', o.guest_last_name)
             END as customer_name,
             r.refund_reference, r.amount as refund_amount, r.status as refund_status
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN deliveries d ON o.id = d.order_id
      LEFT JOIN refunds r ON o.id = r.order_id
      WHERE 1=1
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN deliveries d ON o.id = d.order_id
      LEFT JOIN refunds r ON o.id = r.order_id
      WHERE 1=1
    `;

    const queryParams = [];

    // Search
    if (search) {
      const searchTerm = `%${search}%`;
      const searchCondition = ` AND (o.order_number LIKE ? OR o.guest_first_name LIKE ? OR o.guest_last_name LIKE ? OR o.guest_email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR r.refund_reference LIKE ?)`;
      baseQuery += searchCondition;
      countQuery += searchCondition;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filters
    if (status && status !== 'all') {
      baseQuery += ` AND o.order_status = ?`;
      countQuery += ` AND o.order_status = ?`;
      queryParams.push(status);
    }
    
    if (payment && payment !== 'all') {
      baseQuery += ` AND o.payment_status = ?`;
      countQuery += ` AND o.payment_status = ?`;
      queryParams.push(payment);
    }

    if (delivery && delivery !== 'all') {
      if (delivery === 'unassigned') {
        baseQuery += ` AND (d.delivery_partner_id IS NULL AND d.id IS NOT NULL)`;
        countQuery += ` AND (d.delivery_partner_id IS NULL AND d.id IS NOT NULL)`;
      } else if (delivery === 'assigned') {
        baseQuery += ` AND d.delivery_partner_id IS NOT NULL AND d.status = 'assigned'`;
        countQuery += ` AND d.delivery_partner_id IS NOT NULL AND d.status = 'assigned'`;
      } else {
        baseQuery += ` AND d.status = ?`;
        countQuery += ` AND d.status = ?`;
        queryParams.push(delivery);
      }
    }

    // Gift Type Filter
    if (gift_type === 'gift') {
      baseQuery += ` AND o.is_gift_order = 1`;
      countQuery += ` AND o.is_gift_order = 1`;
    } else if (gift_type === 'regular') {
      baseQuery += ` AND o.is_gift_order = 0`;
      countQuery += ` AND o.is_gift_order = 0`;
    }

    // Sorting
    let orderBy = 'o.created_at DESC';
    switch (sort) {
      case 'oldest': orderBy = 'o.created_at ASC'; break;
      case 'highest_amount': orderBy = 'o.total_amount DESC'; break;
      case 'lowest_amount': orderBy = 'o.total_amount ASC'; break;
      case 'newest':
      default: orderBy = 'o.created_at DESC'; break;
    }

    baseQuery += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    
    const listParams = [...queryParams, limitNum, offset];

    const [orders] = await db.query(baseQuery, listParams);
    const [totalRows] = await db.query(countQuery, queryParams);
    const total = totalRows[0].total;

    res.json({
      data: orders,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

exports.getOrderSummary = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN order_status IN ('confirmed', 'preparing') THEN 1 ELSE 0 END) as preparing,
        SUM(CASE WHEN order_status = 'ready' THEN 1 ELSE 0 END) as ready,
        SUM(CASE WHEN order_status = 'out_for_delivery' THEN 1 ELSE 0 END) as out_for_delivery,
        SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN payment_status = 'refunded' THEN 1 ELSE 0 END) as refunded,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as revenue
      FROM orders
    `);

    res.json(rows[0] || {
      total_orders: 0, pending: 0, preparing: 0, out_for_delivery: 0, delivered: 0, cancelled: 0, refunded: 0, revenue: 0
    });
  } catch (error) {
    console.error('Error fetching order summary:', error);
    res.status(500).json({ message: 'Error fetching order summary' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Order basic details
    const [orders] = await db.query(`
      SELECT o.*, 
             u.email as account_email, 
             u.phone as account_phone,
             d.id as delivery_id, d.status as delivery_status, d.assigned_at, d.picked_up_at, d.delivered_at,
             dp.name as delivery_first_name, '' as delivery_last_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN deliveries d ON o.id = d.order_id
      LEFT JOIN delivery_partners dp ON d.delivery_partner_id = dp.id
      WHERE o.id = ?
    `, [id]);

    if (!orders.length) return res.status(404).json({ message: 'Order not found' });
    const order = orders[0];

    try {
      order.delivery_address_snapshot = typeof order.delivery_address_snapshot === 'string'
        ? JSON.parse(order.delivery_address_snapshot || '{}')
        : (order.delivery_address_snapshot || {});
    } catch (e) {
      order.delivery_address_snapshot = {};
    }

    // 2. Order items
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);

    // 3. Status history
    const [history] = await db.query(`
      SELECT h.*, 
             CASE WHEN u.id IS NOT NULL THEN CONCAT(u.first_name, ' ', u.last_name) ELSE 'System' END as changed_by_name
      FROM order_status_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.order_id = ?
      ORDER BY h.created_at ASC
    `, [id]);

    // 4. Payment details
    const [payments] = await db.query(
      `SELECT id, order_id, gateway, payment_method, transaction_reference, payment_reference,
              amount, currency, status, failure_reason, paid_at, refund_reference, refund_amount,
              refund_status, refund_reason, refunded_at, created_at
       FROM payments 
       WHERE order_id = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [id]
    );

    // 5. Refund details
    const refund = await refundService.getRefundByOrderId(id);

    // 6. Cancellation request if any
    const [cancellations] = await db.query(
      `SELECT * FROM order_cancellations WHERE order_id = ? ORDER BY requested_at DESC LIMIT 1`,
      [id]
    );

    res.json({
      ...order,
      items,
      history,
      payment: payments.length > 0 ? payments[0] : null,
      refund,
      cancellation: cancellations.length > 0 ? cancellations[0] : null
    });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({ message: 'Error fetching order details' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, processRefund } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const [orders] = await db.query('SELECT order_number, user_id, payment_status, order_status FROM orders WHERE id = ?', [id]);
    if (!orders.length) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    // Transition order status
    await orderEventService.transitionOrderStatus(
      id, 
      order.order_number, 
      order.user_id, 
      status, 
      'admin', 
      req.user.sub, 
      note || 'Admin manually updated status'
    );

    // If order is cancelled and payment was PAID, auto-process simulated refund if requested
    if (status === 'cancelled' && order.payment_status === 'paid' && processRefund) {
      await refundService.processRefund({
        orderId: id,
        adminId: req.user.sub,
        reason: note || 'Order cancelled by admin'
      });
    }

    res.json({ success: true, message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: error.message || 'Error updating order status' });
  }
};

exports.processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.sub;
    const { reason } = req.body;

    const result = await refundService.processRefund({
      orderId: id,
      adminId,
      reason: reason || 'Order cancelled by admin'
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to process refund'
    });
  }
};

exports.getOrderRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const refund = await refundService.getRefundByOrderId(id);

    if (!refund) {
      return res.status(404).json({ success: false, message: 'No refund record found for this order' });
    }

    res.status(200).json({
      success: true,
      data: refund
    });
  } catch (error) {
    console.error('Error getting refund details:', error);
    res.status(500).json({ success: false, message: 'Error retrieving refund details' });
  }
};

exports.assignDelivery = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { delivery_partner_id } = req.body;

    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id]);
    if (!orders.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = orders[0];
    if (order.order_status === 'pending') {
      await connection.rollback();
      return res.status(400).json({ message: 'Order must be confirmed before assigning a delivery agent.' });
    }
    if (order.order_status === 'cancelled' || order.order_status === 'delivered') {
      await connection.rollback();
      return res.status(400).json({ message: 'Order status invalid for delivery assignment.' });
    }

    const [partners] = await connection.query("SELECT * FROM delivery_partners WHERE id = ? AND status = 'active' FOR UPDATE", [delivery_partner_id]);
    if (!partners.length) {
      await connection.rollback();
      return res.status(400).json({ message: 'Delivery partner not found or inactive' });
    }

    const [deliveries] = await connection.query('SELECT * FROM deliveries WHERE order_id = ?', [id]);
    if (deliveries.length) {
      await connection.query("UPDATE deliveries SET delivery_partner_id = ?, status = 'assigned', assigned_at = NOW() WHERE id = ?", [delivery_partner_id, deliveries[0].id]);
    } else {
      await connection.query("INSERT INTO deliveries (order_id, delivery_partner_id, status, assigned_at) VALUES (?, ?, 'assigned', NOW())", [id, delivery_partner_id]);
    }

    await connection.commit();

    // Send Notification to Delivery Agent
    try {
      const [partner] = await db.query("SELECT email FROM delivery_partners WHERE id = ?", [delivery_partner_id]);
      if (partner.length > 0) {
        const [agentUsers] = await db.query("SELECT id FROM users WHERE email = ?", [partner[0].email]);
        if (agentUsers.length > 0) {
          const notificationService = require('../services/notificationService');
          await notificationService.createNotification(
            agentUsers[0].id,
            id,
            'DELIVERY_ASSIGNED',
            'New Delivery Assigned',
            `You have been assigned to deliver order ${order.order_number}.`,
            { orderId: id, orderNumber: order.order_number }
          );
        }
      }
    } catch (notifErr) {
      console.error('Error sending delivery agent notification:', notifErr);
    }

    res.json({ message: 'Delivery agent assigned successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error assigning delivery:', error);
    res.status(500).json({ message: 'Error assigning delivery' });
  } finally {
    connection.release();
  }
};

exports.getCancellationRequests = async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    
    let query = `
      SELECT cr.*, o.order_number, o.total_amount, o.payment_status,
             CONCAT(u.first_name, ' ', u.last_name) as customer_name
      FROM order_cancellations cr
      JOIN orders o ON cr.order_id = o.id
      JOIN users u ON cr.customer_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    if (status !== 'all') {
      query += ' AND cr.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY cr.requested_at DESC';
    
    const [requests] = await db.query(query, params);
    res.json({ data: requests });
  } catch (error) {
    console.error('Error fetching cancellation requests:', error);
    res.status(500).json({ message: 'Error fetching cancellation requests' });
  }
};

exports.approveCancellation = async (req, res) => {
  try {
    const { id } = req.params; // this is order_id
    const adminId = req.user.sub;
    
    await cancellationService.approveCancellation(id, adminId);
    
    res.json({ success: true, message: 'Cancellation approved successfully and refund processed' });
  } catch (error) {
    console.error('Error approving cancellation:', error);
    res.status(400).json({ message: error.message || 'Error approving cancellation' });
  }
};

exports.rejectCancellation = async (req, res) => {
  try {
    const { id } = req.params; // order_id
    const adminId = req.user.sub;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    await cancellationService.rejectCancellation(id, adminId, reason);
    
    res.json({ success: true, message: 'Cancellation rejected successfully' });
  } catch (error) {
    console.error('Error rejecting cancellation:', error);
    res.status(400).json({ message: error.message || 'Error rejecting cancellation' });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let baseQuery = `
      SELECT p.id, p.order_id, p.transaction_reference, p.payment_method, p.gateway,
             p.amount, p.currency, p.status, p.failure_reason, p.paid_at, p.created_at,
             p.refund_reference, p.refund_amount, p.refund_status, p.refunded_at,
             o.order_number,
             CASE 
               WHEN u.id IS NOT NULL THEN CONCAT(u.first_name, ' ', u.last_name)
               ELSE CONCAT(o.guest_first_name, ' ', o.guest_last_name)
             END as customer_name,
             u.email as customer_email
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];

    if (search) {
      const searchTerm = `%${search}%`;
      const searchCondition = ` AND (o.order_number LIKE ? OR p.transaction_reference LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR p.refund_reference LIKE ?)`;
      baseQuery += searchCondition;
      countQuery += searchCondition;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'all') {
      baseQuery += ` AND p.status = ?`;
      countQuery += ` AND p.status = ?`;
      queryParams.push(status);
    }

    baseQuery += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    const listParams = [...queryParams, limitNum, offset];

    const [payments] = await db.query(baseQuery, listParams);
    const [totalRows] = await db.query(countQuery, queryParams);
    const total = totalRows[0].total;

    res.json({
      data: payments,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments' });
  }
};

exports.getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentService = require('../services/paymentService');
    const details = await paymentService.getPaymentDetails(id);
    res.json(details);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(500).json({ message: 'Error fetching payment details' });
  }
};
