-- ===============================================================================
-- PAYMENT SYSTEM MIGRATION
-- ===============================================================================
-- Run this migration ONCE against the icecream_db database.
-- It is designed to be re-runnable (uses IF NOT EXISTS / IGNORE where possible).

-- ---------------------------------------------------------------------------
-- 1. ENSURE order_cancellations TABLE EXISTS
--    (Used by cancellationService but may not be in original schema.sql)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_cancellations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  customer_id INT NOT NULL,
  reason TEXT,
  customer_message TEXT,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
  admin_id INT NULL,
  admin_reason TEXT NULL,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  rejected_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 2. ENSURE refunds TABLE EXISTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refunds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  customer_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  reason TEXT,
  processed_by INT NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 3. ADD cancellation_status COLUMN TO orders (IF MISSING)
-- ---------------------------------------------------------------------------
-- MySQL will error if column already exists, so we use a procedure
DELIMITER //
CREATE PROCEDURE add_column_if_not_exists()
BEGIN
  IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'cancellation_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN cancellation_status VARCHAR(20) NULL AFTER order_status;
  END IF;

  -- Add product_id to order_items if missing
  IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'product_id'
  ) THEN
    ALTER TABLE order_items ADD COLUMN product_id INT NULL AFTER order_id;
  END IF;

  -- Add metadata to notifications if missing
  IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'metadata'
  ) THEN
    ALTER TABLE notifications ADD COLUMN metadata JSON NULL AFTER message;
  END IF;
END //
DELIMITER ;
CALL add_column_if_not_exists();
DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- ---------------------------------------------------------------------------
-- 4. ENHANCE payments TABLE FOR DEMO PAYMENT SYSTEM
-- ---------------------------------------------------------------------------

-- 4a. Expand status ENUM to support processing and cancelled
ALTER TABLE payments MODIFY COLUMN status ENUM('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded') NOT NULL DEFAULT 'pending';

-- 4b. Add payment_method column (Demo UPI, Demo Card, etc.)
DELIMITER //
CREATE PROCEDURE add_payment_columns()
BEGIN
  IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'payment_method'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_method VARCHAR(50) NULL AFTER gateway;
  END IF;

  -- 4c. Add transaction_reference column (unique per attempt)
  IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'transaction_reference'
  ) THEN
    ALTER TABLE payments ADD COLUMN transaction_reference VARCHAR(100) NULL AFTER payment_reference;
    ALTER TABLE payments ADD UNIQUE INDEX idx_transaction_reference (transaction_reference);
  END IF;

  -- 4d. Add refund tracking columns
  IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'refund_reference'
  ) THEN
    ALTER TABLE payments ADD COLUMN refund_reference VARCHAR(100) NULL;
    ALTER TABLE payments ADD COLUMN refund_amount DECIMAL(10,2) NULL;
    ALTER TABLE payments ADD COLUMN refund_status ENUM('pending', 'completed') NULL;
    ALTER TABLE payments ADD COLUMN refund_reason TEXT NULL;
    ALTER TABLE payments ADD COLUMN refunded_at TIMESTAMP NULL;
  END IF;
END //
DELIMITER ;
CALL add_payment_columns();
DROP PROCEDURE IF EXISTS add_payment_columns;

-- 4e. Change default gateway to 'demo' and currency to 'INR'
ALTER TABLE payments MODIFY COLUMN gateway VARCHAR(50) NOT NULL DEFAULT 'demo';
ALTER TABLE payments MODIFY COLUMN currency VARCHAR(10) DEFAULT 'INR';

-- 4f. Expand orders.payment_status to include processing
ALTER TABLE orders MODIFY COLUMN payment_status ENUM('pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded') DEFAULT 'pending';

-- ---------------------------------------------------------------------------
-- 5. CREATE payment_events AUDIT TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  INDEX idx_payment_events_payment_id (payment_id)
);

-- ---------------------------------------------------------------------------
-- 6. UPDATE EXISTING PAYMENT RECORDS (razorpay → demo)
-- ---------------------------------------------------------------------------
UPDATE payments SET gateway = 'demo' WHERE gateway = 'razorpay';
UPDATE payments SET currency = 'INR' WHERE currency = 'USD';

-- Generate transaction references for existing records that don't have one
DELIMITER //
CREATE PROCEDURE backfill_transaction_refs()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE pid INT;
  DECLARE cur CURSOR FOR SELECT id FROM payments WHERE transaction_reference IS NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO pid;
    IF done THEN LEAVE read_loop; END IF;
    UPDATE payments SET transaction_reference = CONCAT('PAY-LEGACY-', LPAD(pid, 6, '0')) WHERE id = pid;
  END LOOP;
  CLOSE cur;
END //
DELIMITER ;
CALL backfill_transaction_refs();
DROP PROCEDURE IF EXISTS backfill_transaction_refs;
