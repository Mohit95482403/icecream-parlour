require('dotenv').config();
const db = require('../config/db');

async function migrate() {
  try {
    console.log('Running refunds migration...');
    const [cols] = await db.query("SHOW COLUMNS FROM refunds LIKE 'payment_id'");
    if (cols.length === 0) {
      await db.query("ALTER TABLE refunds ADD COLUMN payment_id INT NULL AFTER order_id");
      console.log('Added payment_id column to refunds table.');
    }

    await db.query("ALTER TABLE refunds MODIFY COLUMN status ENUM('REFUND_PENDING', 'REFUND_PROCESSING', 'REFUNDED', 'REFUND_FAILED') NOT NULL DEFAULT 'REFUND_PENDING'");

    const [indexes] = await db.query("SHOW INDEX FROM refunds WHERE Key_name = 'idx_refunds_ref'");
    if (indexes.length === 0) {
      await db.query("ALTER TABLE refunds ADD UNIQUE INDEX idx_refunds_ref (refund_reference)");
      console.log('Added unique index for refund_reference.');
    }

    // Backfill any legacy refunds that didn't have payment_id or refund_reference synced
    const [legacyRefunds] = await db.query("SELECT * FROM refunds WHERE refund_reference IS NULL OR payment_id IS NULL");
    for (const r of legacyRefunds) {
      const [payments] = await db.query("SELECT id FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1", [r.order_id]);
      const paymentId = payments.length > 0 ? payments[0].id : null;
      const refRef = r.refund_reference || `REF-LEGACY-${String(r.id).padStart(6, '0')}`;
      
      await db.query(
        "UPDATE refunds SET payment_id = ?, refund_reference = ? WHERE id = ?",
        [paymentId, refRef, r.id]
      );

      if (paymentId) {
        await db.query(
          "UPDATE payments SET status = 'refunded', refund_reference = ?, refund_amount = ?, refund_status = 'completed', refunded_at = COALESCE(refunded_at, NOW()) WHERE id = ?",
          [refRef, r.amount, paymentId]
        );
      }
    }
    console.log(`Backfilled ${legacyRefunds.length} legacy refund records.`);

    console.log('Refunds migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
