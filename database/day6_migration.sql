-- Day 6 Migration: Add fields to users and payments

ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL;

ALTER TABLE payments ADD COLUMN gateway_order_id VARCHAR(150) NULL AFTER gateway;
ALTER TABLE payments ADD COLUMN gateway_payment_id VARCHAR(150) NULL AFTER gateway_order_id;
ALTER TABLE payments ADD COLUMN failure_reason TEXT NULL AFTER status;
