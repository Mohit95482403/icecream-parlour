const db = require('../config/db');

const adminUserController = {
  getUsers: async (req, res) => {
    try {
      const { search = '', status = 'all', sort = 'newest', page = 1, limit = 20 } = req.query;
      
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = [10, 20, 50].includes(parseInt(limit, 10)) ? parseInt(limit, 10) : 20;
      const offset = (pageNum - 1) * limitNum;

      let whereClause = "u.role = 'customer'";
      const queryParams = [];

      // Search
      if (search) {
        whereClause += " AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Status
      if (status === 'active' || status === 'blocked') {
        whereClause += " AND u.status = ?";
        queryParams.push(status);
      }

      // Sorting
      let orderBy = "u.created_at DESC";
      switch (sort) {
        case 'oldest': orderBy = "u.created_at ASC"; break;
        case 'highest_spend': orderBy = "total_spent DESC"; break;
        case 'lowest_spend': orderBy = "total_spent ASC"; break;
        case 'most_orders': orderBy = "order_count DESC"; break;
        case 'name_asc': orderBy = "u.first_name ASC, u.last_name ASC"; break;
        case 'name_desc': orderBy = "u.first_name DESC, u.last_name DESC"; break;
        case 'newest':
        default: orderBy = "u.created_at DESC"; break;
      }

      // Get Total Count
      const [countResult] = await db.query(`SELECT COUNT(*) as total FROM users u WHERE ${whereClause}`, queryParams);
      const total = countResult[0].total;

      // Get Paginated Users with Aggregations
      const query = `
        SELECT 
          u.id, u.first_name, u.last_name, u.email, u.phone, u.status, u.created_at, u.last_login_at,
          COUNT(DISTINCT CASE WHEN o.order_status != 'cancelled' THEN o.id END) as order_count,
          COALESCE(SUM(CASE WHEN o.payment_status = 'paid' AND o.order_status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) as total_spent
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE ${whereClause}
        GROUP BY u.id
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;

      const [users] = await db.query(query, [...queryParams, limitNum, offset]);

      return res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
          }
        }
      });
    } catch (error) {
      console.error('getUsers error:', error);
      res.status(500).json({ success: false, message: 'Internal server error fetching users' });
    }
  },

  getUserById: async (req, res) => {
    try {
      const { id } = req.params;

      const [users] = await db.query(`
        SELECT id, first_name, last_name, email, phone, role, status, created_at, last_login_at
        FROM users
        WHERE id = ? AND role = 'customer'
      `, [id]);

      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'Customer not found.' });
      }

      const user = users[0];

      // Get Orders
      const [orders] = await db.query(`
        SELECT id, order_number, total_amount as total, payment_status, order_status as status, created_at
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC
      `, [id]);

      // Calculate Stats
      const validOrders = orders.filter(o => o.status !== 'cancelled');
      const orderCount = validOrders.length;
      const totalSpent = validOrders.reduce((sum, o) => o.payment_status === 'paid' ? sum + parseFloat(o.total) : sum, 0);
      const avgOrderValue = orderCount > 0 ? (totalSpent / orderCount) : 0;
      const lastOrder = orders.length > 0 ? orders[0] : null;

      // Get Addresses
      const [addresses] = await db.query(`
        SELECT id, label, full_name, phone, address_line_1, address_line_2, city, state, postal_code, country, is_default
        FROM addresses
        WHERE user_id = ?
      `, [id]);

      return res.status(200).json({
        success: true,
        data: {
          user,
          stats: {
            orderCount,
            totalSpent,
            avgOrderValue,
            lastOrder
          },
          orders,
          addresses
        }
      });

    } catch (error) {
      console.error('getUserById error:', error);
      res.status(500).json({ success: false, message: 'Internal server error fetching customer details' });
    }
  },

  updateUserStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'blocked'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value.' });
      }

      // Check if user exists and is a customer
      const [users] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
      
      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'Customer not found.' });
      }

      if (users[0].role === 'admin') {
        return res.status(403).json({ success: false, message: 'Cannot modify admin accounts from this endpoint.' });
      }

      await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);

      return res.status(200).json({
        success: true,
        message: `Customer successfully ${status === 'active' ? 'activated' : 'deactivated'}.`
      });

    } catch (error) {
      console.error('updateUserStatus error:', error);
      res.status(500).json({ success: false, message: 'Internal server error updating customer status' });
    }
  }
};

module.exports = adminUserController;
