require('dotenv').config();
const db = require('../config/db');
const authService = require('../services/authService');

async function seedAdmin() {
  try {
    console.log('Verifying admin account (admin@glace.com)...');
    const adminEmail = 'admin@glace.com';
    const adminPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD || 'GlaceAdmin2026!#Secure';
    const passwordHash = await authService.hashPassword(adminPassword);

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (existing.length > 0) {
      await db.query(
        'UPDATE users SET password_hash = ?, role = "admin", status = "active", updated_at = NOW() WHERE email = ?',
        [passwordHash, adminEmail]
      );
      console.log('✅ Admin credentials updated for admin@glace.com.');
    } else {
      await db.query(
        'INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['GLACÉ', 'Administrator', adminEmail, '9811198111', passwordHash, 'admin', 'active']
      );
      console.log('✅ Default Admin Created for admin@glace.com.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  }
}

seedAdmin();
