const jwt = require('jsonwebtoken');

const authMiddleware = {
  // Validate token and attach user payload to request
  protect: (req, res, next) => {
    try {
      let token;
      
      // Check for token in cookies or Authorization header
      if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      }
      
      if (!token) {
        return res.status(401).json({ success: false, error: { message: 'Not authorized, no token provided' } });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_change_me');
      
      // Attach the token payload to the request
      req.user = decoded; // { sub: id, role: string, ... }
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ success: false, error: { message: 'Not authorized, token failed' } });
    }
  },

  // Authorize specific roles
  authorize: (...roles) => {
    return (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, error: { message: 'Not authorized to access this route' } });
      }
      next();
    };
  }
};

module.exports = authMiddleware;
