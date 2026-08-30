const db = require('../config/db');

async function migrate() {
  console.log('Starting Gift Card migration...');
  
  // 1. Create gift_cards table
  await db.query(`
    CREATE TABLE IF NOT EXISTS gift_cards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(32) NOT NULL UNIQUE,
      pin_hash VARCHAR(255),
      initial_amount DECIMAL(10,2) NOT NULL,
      current_balance DECIMAL(10,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      status ENUM('pending','active','suspended','exhausted','expired','cancelled') DEFAULT 'pending',
      purchased_by INT,
      purchase_order_id INT,
      recipient_email VARCHAR(150),
      recipient_name VARCHAR(150),
      sender_name VARCHAR(150),
      personal_message TEXT,
      redeemed_by INT,
      redeemed_at TIMESTAMP NULL,
      activated_at TIMESTAMP NULL,
      expires_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (purchased_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (purchase_order_id) REFERENCES orders(id) ON DELETE SET NULL,
      FOREIGN KEY (redeemed_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_code (code),
      INDEX idx_status (status),
      INDEX idx_purchased_by (purchased_by),
      INDEX idx_redeemed_by (redeemed_by)
    )
  `);
  console.log('✅ gift_cards table created/verified.');

  // 2. Create gift_card_transactions table
  await db.query(`
    CREATE TABLE IF NOT EXISTS gift_card_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      gift_card_id INT NOT NULL,
      type ENUM('activation','redemption','refund','adjustment','expiry') NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      balance_after DECIMAL(10,2) NOT NULL,
      reference_type VARCHAR(50),
      reference_id VARCHAR(100),
      description TEXT,
      performed_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id) ON DELETE CASCADE,
      FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_gift_card (gift_card_id),
      INDEX idx_reference (reference_type, reference_id)
    )
  `);
  console.log('✅ gift_card_transactions table created/verified.');

  // 3. Add gift_card_amount and gift_card_id to orders
  try {
    await db.query(`
      ALTER TABLE orders ADD COLUMN gift_card_amount DECIMAL(10,2) DEFAULT 0.00 AFTER discount_amount
    `);
    console.log('✅ Added gift_card_amount column to orders.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ gift_card_amount column already exists in orders.');
    } else {
      throw err;
    }
  }

  try {
    await db.query(`
      ALTER TABLE orders ADD COLUMN gift_card_id INT DEFAULT NULL AFTER gift_card_amount
    `);
    console.log('✅ Added gift_card_id column to orders.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ gift_card_id column already exists in orders.');
    } else {
      throw err;
    }
  }

  console.log('🎉 Gift Card migration successfully completed.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
