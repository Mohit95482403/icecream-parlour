const db = require('./server/config/db');
async function run() {
  try {
    await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('customer', 'admin', 'delivery') DEFAULT 'customer'");
    console.log('Successfully altered users.role');
  } catch (err) {
    console.error('Error altering table:', err.message);
  }
  process.exit(0);
}
run();
