const db = require('./server/config/db');

(async () => {
  try {
    await db.query(`
      ALTER TABLE orders
        ADD COLUMN is_gift_order TINYINT(1) NOT NULL DEFAULT 0 AFTER notes,
        ADD COLUMN gift_recipient_name VARCHAR(150) NULL AFTER is_gift_order,
        ADD COLUMN gift_recipient_phone VARCHAR(20) NULL AFTER gift_recipient_name,
        ADD COLUMN gift_recipient_address TEXT NULL AFTER gift_recipient_phone,
        ADD COLUMN gift_recipient_city VARCHAR(100) NULL AFTER gift_recipient_address,
        ADD COLUMN gift_recipient_state VARCHAR(100) NULL AFTER gift_recipient_city,
        ADD COLUMN gift_recipient_postal_code VARCHAR(10) NULL AFTER gift_recipient_state,
        ADD COLUMN gift_message VARCHAR(300) NULL AFTER gift_recipient_postal_code
    `);
    console.log('✅ Gift columns added successfully');

    const [cols] = await db.query("SHOW COLUMNS FROM orders WHERE Field LIKE 'gift%' OR Field = 'is_gift_order'");
    cols.forEach(c => console.log(`  ${c.Field}: ${c.Type} ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'} DEFAULT ${c.Default}`));
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Gift columns already exist (idempotent)');
    } else {
      throw err;
    }
  }
  await db.end();
})();
