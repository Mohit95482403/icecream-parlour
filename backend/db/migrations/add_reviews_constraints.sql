-- Migration: Add admin_note column and constraints to reviews table
-- Date: 2026-08-22

-- Add admin_note column for admin rejection reasons
ALTER TABLE reviews ADD COLUMN admin_note TEXT NULL AFTER status;

-- Prevent duplicate reviews: one review per user per product per order
ALTER TABLE reviews ADD UNIQUE INDEX uq_user_product_order (user_id, product_id, order_id);

-- Performance indexes
ALTER TABLE reviews ADD INDEX idx_reviews_status (status);
ALTER TABLE reviews ADD INDEX idx_reviews_created (created_at);
