const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthService {
  async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  generateToken(user) {
    const payload = {
      sub: user.id,
      role: user.role
    };
    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_key_change_me', { expiresIn: '7d' });
  }

  getCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
  }

  // Safe customer payload, no password hash
  sanitizeUser(user) {
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    };
  }
}

module.exports = new AuthService();
