const db = require('../config/db');
const authService = require('../services/authService');

const adminController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, error: { message: 'Email and password are required' } });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Find user
      const [users] = await db.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
      if (users.length === 0) {
        return res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
      }

      const user = users[0];

      if (user.role !== 'admin') {
        return res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ success: false, error: { message: 'Your admin account is currently unavailable. Please contact system administrator.' } });
      }

      const isMatch = await authService.verifyPassword(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
      }

      // Update last login
      await db.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

      // Generate session
      const token = authService.generateToken(user);
      const cookieOptions = authService.getCookieOptions();

      res.cookie('token', token, cookieOptions);

      return res.status(200).json({
        success: true,
        data: { admin: authService.sanitizeUser(user), token }
      });

    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ success: false, error: { message: 'Internal server error during login' } });
    }
  },

  getDashboard: async (req, res) => {
    try {
      // Get total revenue from paid orders
      const [revenueResult] = await db.query(`
        SELECT COALESCE(SUM(total_amount), 0) as totalRevenue 
        FROM orders 
        WHERE payment_status = 'paid' AND order_status != 'cancelled'
      `);
      
      // Get total order count
      const [ordersResult] = await db.query(`
        SELECT COUNT(*) as totalOrders FROM orders
      `);
      
      // Get total customer count
      const [customersResult] = await db.query(`
        SELECT COUNT(*) as totalCustomers FROM users WHERE role = 'customer'
      `);
      
      // Get active product count
      const [productsResult] = await db.query(`
        SELECT COUNT(*) as activeProducts FROM products WHERE status = 'active'
      `);

      // Get order status summary
      const [statusCounts] = await db.query(`
        SELECT order_status as status, COUNT(*) as count 
        FROM orders 
        GROUP BY order_status
      `);
      
      const orderStatus = {
        pending: 0,
        confirmed: 0,
        preparing: 0,
        out_for_delivery: 0,
        delivered: 0,
        cancelled: 0
      };
      
      statusCounts.forEach(row => {
        orderStatus[row.status] = row.count;
      });

      // Get recent orders
      const [recentOrders] = await db.query(`
        SELECT o.id, o.order_number, o.created_at, o.total_amount as total, o.order_status as status, o.payment_status, 
               u.first_name, u.last_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 5
      `);

      // Get recent customers
      const [recentCustomers] = await db.query(`
        SELECT id, first_name, last_name, email, created_at
        FROM users
        WHERE role = 'customer'
        ORDER BY created_at DESC
        LIMIT 5
      `);

      // Get low stock products
      const [lowStock] = await db.query(`
        SELECT p.name as product_name, pv.size, i.quantity as stock_quantity
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        LEFT JOIN inventory i ON pv.id = i.variant_id
        WHERE i.quantity <= 10 OR i.quantity IS NULL
        ORDER BY i.quantity ASC
        LIMIT 5
      `);

      return res.status(200).json({
        success: true,
        data: {
          revenue: revenueResult[0].totalRevenue,
          orders: ordersResult[0].totalOrders,
          customers: customersResult[0].totalCustomers,
          products: productsResult[0].activeProducts,
          orderStatus,
          recentOrders,
          recentCustomers,
          lowStock
        }
      });
      
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      res.status(500).json({ success: false, error: { message: 'Internal server error loading dashboard data' } });
    }
  }
};

module.exports = adminController;
