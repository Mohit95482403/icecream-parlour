const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Robustly extracts and sanitizes token from Authorization header or cookies.
 * Returns valid token string or null.
 */
function extractToken(req) {
  let token = null;

  // 1. Check Authorization header
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (typeof authHeader === 'string' && authHeader.trim().length > 0) {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith('bearer ')) {
      token = trimmed.slice(7).trim();
    } else {
      token = trimmed;
    }
  }

  // 2. Check cookies
  if (!token && req.cookies && typeof req.cookies.token === 'string') {
    token = req.cookies.token.trim();
  }

  // 3. Reject invalid placeholder/literal strings
  if (
    !token ||
    token === 'undefined' ||
    token === 'null' ||
    token === '[object Object]' ||
    token.length < 10
  ) {
    return null;
  }

  // Strip potential surrounding quotes
  token = token.replace(/^["']|["']$/g, '').trim();

  // Validate structural JWT format: exactly 3 non-empty dot-separated segments
  const segments = token.split('.');
  if (segments.length !== 3 || segments.some(seg => seg.length === 0)) {
    return null;
  }

  return token;
}

const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const hasHeader = typeof authHeader === 'string' && authHeader.trim().length > 0;
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: hasHeader ? 'Invalid or missing authentication token.' : 'Authentication required',
        error: { message: hasHeader ? 'Invalid or missing authentication token.' : 'Authentication required' }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_change_me');

    // Check role in token first
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this area.',
        error: { message: 'You do not have permission to access this area.' }
      });
    }

    // Double check with DB to ensure user wasn't downgraded or deactivated
    const [users] = await db.query('SELECT role, status FROM users WHERE id = ?', [decoded.sub]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        error: { message: 'User not found' }
      });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently inactive.',
        error: { message: 'Your account is currently inactive.' }
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this area.',
        error: { message: 'You do not have permission to access this area.' }
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please sign in again.',
        error: { message: 'Your session has expired. Please sign in again.' }
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing authentication token.',
      error: { message: 'Invalid or missing authentication token.' }
    });
  }
};

module.exports = { requireAdmin };
