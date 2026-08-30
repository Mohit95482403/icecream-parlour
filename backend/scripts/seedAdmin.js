require('dotenv').config();
const db = require('../config/db');
const authService = require('../services/authService');

async function seedAdmin() {
  try {
    console.log('Checking for existing admin accounts...');
    const [existingAdmins] = await db.query('SELECT id FROM users WHERE role = "admin"');
    
    if (existingAdmins.length > 0) {
      console.log('Admin account already exists. Skipping seed.');
      process.exit(0);
    }

    console.log('Creating default admin account...');
    const adminEmail = 'admin@glace.com';
    const adminPassword = 'Admin123!';
    const passwordHash = await authService.hashPassword(adminPassword);

    await db.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['System', 'Admin', adminEmail, passwordHash, 'admin', 'active']
    );

    console.log(`
✅ Default Admin Created!
------------------------------------
Email: ${adminEmail}
Password: ${adminPassword}
------------------------------------
PLEASE CHANGE PASSWORD AFTER DEPLOYMENT
    `);

    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  }
}

seedAdmin();
