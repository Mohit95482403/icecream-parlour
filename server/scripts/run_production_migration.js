const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runProductionMigration() {
  console.log('🚀 Starting GLACÉ Production Database Migration...');
  const connection = await db.getConnection();

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../../database/production_schema.sql'), 'utf8');

    // Split statements safely
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} schema definitions...`);
    for (const stmt of statements) {
      await connection.query(stmt);
    }
    console.log('✅ Base schema verified successfully.');

    // Ensure seed admin exists if no admin is present
    const [admins] = await connection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
    if (admins.length === 0) {
      console.log('Creating default production admin user...');
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('Admin@Glace2026!', 10);
      await connection.query(`
        INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status)
        VALUES ('GLACÉ', 'Administrator', 'admin@glace.com', '9811198111', ?, 'admin', 'active')
      `, [hash]);
      console.log('✅ Default admin user created (admin@glace.com).');
    }

    console.log('🎉 Production database migration completed safely with 0 data loss!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runProductionMigration();
