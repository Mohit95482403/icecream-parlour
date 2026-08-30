const db = require('../config/db');
const authService = require('../services/authService');

const authController = {
  register: async (req, res) => {
    try {
      const { firstName, lastName, email, phone, password } = req.body;

      // Basic validation
      if (!firstName || !email || !password) {
        return res.status(400).json({ success: false, error: { message: 'First name, email, and password are required' } });
      }

      if (password.length < 8) {
        return res.status(400).json({ success: false, error: { message: 'Password must be at least 8 characters long' } });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user exists
      const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, error: { message: 'An account with this email already exists' } });
      }

      // Hash password and create user
      const passwordHash = await authService.hashPassword(password);
      
      const [result] = await db.query(
        'INSERT INTO users (first_name, last_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, "customer")',
        [firstName.trim(), lastName?.trim() || '', normalizedEmail, phone?.trim() || null, passwordHash]
      );

      const userId = result.insertId;

      const [newUserRow] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      const user = newUserRow[0];

      // Generate session
      const token = authService.generateToken(user);
      const cookieOptions = authService.getCookieOptions();

      res.cookie('token', token, cookieOptions);

      return res.status(201).json({
        success: true,
        data: { customer: authService.sanitizeUser(user), token }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, error: { message: 'Internal server error during registration' } });
    }
  },

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

      if (user.status !== 'active') {
        return res.status(403).json({ success: false, error: { message: 'Your account is currently unavailable. Please contact support.' } });
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
        data: { customer: authService.sanitizeUser(user), token }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: { message: 'Internal server error during login' } });
    }
  },

  logout: (req, res) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  },

  me: async (req, res) => {
    // req.user is populated by authMiddleware
    try {
      const [users] = await db.query('SELECT * FROM users WHERE id = ? AND status = "active"', [req.user.sub]);
      
      if (users.length === 0) {
        return res.status(401).json({ success: false, error: { message: 'User not found or inactive' } });
      }
      
      return res.status(200).json({
        success: true,
        data: { customer: authService.sanitizeUser(users[0]) }
      });
    } catch (error) {
      console.error('Me query error:', error);
      res.status(500).json({ success: false, error: { message: 'Internal server error retrieving profile' } });
    }
  }
};

module.exports = authController;
