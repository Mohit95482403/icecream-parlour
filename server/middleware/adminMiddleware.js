const jwt = require('jsonwebtoken');
const db = require('../config/db');

const requireAdmin = async (req, res, next) => {
  try {
    let token;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_change_me');
    
    // Check role in token first
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'You do not have permission to access this area.' } });
    }

    // Double check with DB to ensure user wasn't downgraded or deactivated
    const [users] = await db.query('SELECT role, status FROM users WHERE id = ?', [decoded.sub]);
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, error: { message: 'User not found' } });
    }
    
    const user = users[0];
    
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: { message: 'Your account is currently inactive.' } });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'You do not have permission to access this area.' } });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: { message: 'Your session has expired. Please sign in again.' } });
    }
    return res.status(401).json({ success: false, error: { message: 'Invalid or missing authentication token.' } });
  }
};

module.exports = { requireAdmin };
