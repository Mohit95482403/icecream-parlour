require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Creating settings table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        setting_group VARCHAR(50) DEFAULT 'general',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert some default settings
    console.log('Inserting default settings...');
    await connection.query(`
      INSERT IGNORE INTO settings (setting_key, setting_value, setting_group) VALUES
      ('store_name', 'GLACÉ', 'general'),
      ('store_email', 'hello@glace.com', 'general'),
      ('store_phone', '+91 98765 43210', 'general'),
      ('store_address', '123 Artisan Lane, Mumbai', 'general'),
      ('store_description', 'Premium Artisanal Ice Cream', 'general'),
      ('store_status', 'open', 'store'),
      ('currency', 'INR', 'store'),
      ('tax_rate', '18', 'store'),
      ('min_order_amount', '500', 'store'),
      ('notify_new_order', 'true', 'notifications'),
      ('notify_low_stock', 'true', 'notifications'),
      ('maintenance_mode', 'false', 'system')
    `);

    console.log('Settings migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

migrate();
