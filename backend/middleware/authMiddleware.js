const jwt = require('jsonwebtoken');

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

const authMiddleware = {
  // Validate token and attach user payload to request
  protect: (req, res, next) => {
    try {
      const authHeader = req.headers?.authorization || req.headers?.Authorization;
      const hasHeader = typeof authHeader === 'string' && authHeader.trim().length > 0;
      const token = extractToken(req);

      if (!token) {
        return res.status(401).json({
          success: false,
          message: hasHeader ? 'Not authorized, invalid token' : 'Not authorized, no token provided',
          error: {
            message: hasHeader ? 'Not authorized, invalid token' : 'Not authorized, no token provided'
          }
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_change_me');

      // Attach the token payload to the request
      req.user = decoded; // { sub: id, role: string, ... }

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
        message: 'Not authorized, invalid token',
        error: { message: 'Not authorized, invalid token' }
      });
    }
  },

  // Authorize specific roles
  authorize: (...roles) => {
    return (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this route',
          error: { message: 'Not authorized to access this route' }
        });
      }
      next();
    };
  }
};

module.exports = authMiddleware;
