const db = require('../config/db');
const orderEventService = require('../services/orderEventService');
const bcrypt = require('bcryptjs');

exports.getDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', sort = 'newest' } = req.query;
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let baseQuery = `
      SELECT d.*, 
             o.order_number, o.guest_first_name, o.guest_last_name, o.order_status,
             CASE 
               WHEN u.id IS NOT NULL THEN CONCAT(u.first_name, ' ', u.last_name)
               ELSE CONCAT(o.guest_first_name, ' ', o.guest_last_name)
             END as customer_name,
             CONCAT(dp.name, '') as delivery_person_name
      FROM deliveries d
      JOIN orders o ON d.order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN delivery_partners dp ON d.delivery_partner_id = dp.id
      WHERE 1=1
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total
      FROM deliveries d
      JOIN orders o ON d.order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];

    // Search
    if (search) {
      const searchTerm = `%${search}%`;
      const searchCondition = ` AND (o.order_number LIKE ? OR o.guest_first_name LIKE ? OR o.guest_last_name LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
      baseQuery += searchCondition;
      countQuery += searchCondition;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filters
    if (status && status !== 'all') {
      if (status === 'unassigned') {
        baseQuery += ` AND d.delivery_partner_id IS NULL`;
        countQuery += ` AND d.delivery_partner_id IS NULL`;
      } else if (status === 'assigned') {
        baseQuery += ` AND d.delivery_partner_id IS NOT NULL AND d.status = 'assigned'`;
        countQuery += ` AND d.delivery_partner_id IS NOT NULL AND d.status = 'assigned'`;
      } else {
        baseQuery += ` AND d.status = ?`;
        countQuery += ` AND d.status = ?`;
        queryParams.push(status);
      }
    }

    // Sorting
    let orderBy = 'd.created_at DESC';
    switch (sort) {
      case 'oldest': orderBy = 'd.created_at ASC'; break;
      case 'newest':
      default: orderBy = 'd.created_at DESC'; break;
    }

    baseQuery += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    
    const listParams = [...queryParams, limitNum, offset];

    const [deliveries] = await db.query(baseQuery, listParams);
    const [totalRows] = await db.query(countQuery, queryParams);
    const total = totalRows[0].total;

    res.json({
      data: deliveries,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    });

  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ message: 'Error fetching deliveries' });
  }
};

exports.getEligibleDeliveryPersonnel = async (req, res) => {
  try {
    const [personnel] = await db.query(
      "SELECT id, name as first_name, '' as last_name, email, phone, status, created_at FROM delivery_partners ORDER BY id DESC"
    );
    res.json(personnel);
  } catch (error) {
    console.error('Error fetching delivery personnel:', error);
    res.status(500).json({ message: 'Error fetching delivery personnel' });
  }
};

exports.addDeliveryPersonnel = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, status = 'active' } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({ message: 'First name, email, and password are required' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    await db.query('BEGIN');

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await db.query(
      'INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [firstName, lastName || '', email, phone || null, hashedPassword, 'delivery', status === 'active' ? 'active' : 'blocked']
    );

    const fullName = `${firstName} ${lastName || ''}`.trim();
    const [partnerResult] = await db.query(
      'INSERT INTO delivery_partners (name, phone, email, status) VALUES (?, ?, ?, ?)',
      [fullName, phone || null, email, status]
    );

    await db.query('COMMIT');

    res.json({
      success: true,
      message: 'Delivery agent added successfully',
      agent: {
        id: partnerResult.insertId,
        first_name: fullName,
        email,
        phone,
        status
      }
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error adding delivery agent:', error);
    res.status(500).json({ message: 'Error adding delivery agent' });
  }
};

exports.assignDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_partner_id } = req.body;
    
    // Verify delivery exists
    const [deliveries] = await db.query(
      'SELECT d.order_id, d.status as delivery_status, o.order_status FROM deliveries d JOIN orders o ON d.order_id = o.id WHERE d.id = ?', 
      [id]
    );
    if (!deliveries.length) return res.status(404).json({ message: 'Delivery not found' });
    
    const { order_id: orderId, order_status: orderStatus, delivery_status: deliveryStatus } = deliveries[0];

    // Ensure order is not cancelled or delivered
    if (orderStatus === 'cancelled') {
      return res.status(400).json({ message: 'Cannot assign delivery agent to a cancelled order.' });
    }
    if (['cancelled', 'delivered', 'failed'].includes(deliveryStatus)) {
      return res.status(400).json({ message: 'Delivery is already in a terminal state.' });
    }

    // Verify user exists and is eligible
    if (delivery_partner_id) {
      const [users] = await db.query("SELECT id FROM delivery_partners WHERE id = ? AND status = 'active'", [delivery_partner_id]);
      if (!users.length) return res.status(400).json({ message: 'Invalid or inactive delivery person' });
    }

    await db.query(
      `UPDATE deliveries SET delivery_partner_id = ?, status = 'assigned', assigned_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [delivery_partner_id, id]
    );

    // Also transition order status to 'processing' or 'ready' if it was pending? 
    // We'll leave order_status alone here, admin updates it separately, or we log a note.
    
    res.json({ message: 'Delivery assigned successfully' });
  } catch (error) {
    console.error('Error assigning delivery:', error);
    res.status(500).json({ message: 'Error assigning delivery' });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    
    const validStatuses = ['pending', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid delivery status' });
    }

    const [deliveries] = await db.query(
      'SELECT d.order_id, d.status as delivery_status, o.order_status FROM deliveries d JOIN orders o ON d.order_id = o.id WHERE d.id = ?', 
      [id]
    );
    if (!deliveries.length) return res.status(404).json({ message: 'Delivery not found' });
    
    const { order_id: orderId, order_status: orderStatus, delivery_status: deliveryStatus } = deliveries[0];

    if (orderStatus === 'cancelled') {
       return res.status(400).json({ message: 'Cannot update delivery status for a cancelled order.' });
    }
    if (['cancelled', 'delivered'].includes(deliveryStatus) && status !== deliveryStatus) {
       return res.status(400).json({ message: 'Delivery is already in a terminal state.' });
    }
    
    let updateFields = "status = ?, updated_at = NOW()";
    const updateParams = [status];
    
    if (status === 'picked_up') {
      updateFields += ", picked_up_at = NOW()";
    } else if (status === 'delivered') {
      updateFields += ", delivered_at = NOW()";
    }

    updateParams.push(id);

    // Sync order status if out for delivery or delivered
    // We use orderEventService to safely transition and log
    const [orders] = await db.query('SELECT order_number, user_id FROM orders WHERE id = ?', [orderId]);
    if (orders.length) {
       if (status === 'out_for_delivery') {
          await orderEventService.transitionOrderStatus(
            orderId, orders[0].order_number, orders[0].user_id, 'out_for_delivery', 'admin', req.user.sub, 'Delivery status updated to out for delivery'
          );
       } else if (status === 'delivered') {
          await orderEventService.transitionOrderStatus(
            orderId, orders[0].order_number, orders[0].user_id, 'delivered', 'admin', req.user.sub, 'Delivery status updated to delivered'
          );
       } else {
         // Just update the delivery row
         await db.query(`UPDATE deliveries SET ${updateFields} WHERE id = ?`, updateParams);
       }
    } else {
      await db.query(`UPDATE deliveries SET ${updateFields} WHERE id = ?`, updateParams);
    }
    
    if (note) {
      await db.query('UPDATE deliveries SET notes = CONCAT(IFNULL(notes, ""), "\n", ?) WHERE id = ?', [note, id]);
    }

    res.json({ message: 'Delivery status updated successfully' });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ message: 'Error updating delivery status' });
  }
};
