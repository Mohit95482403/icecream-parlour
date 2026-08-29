-- 1. Alter Orders Table
ALTER TABLE orders MODIFY COLUMN user_id INT NULL;
ALTER TABLE orders ADD COLUMN guest_first_name VARCHAR(100) NULL AFTER user_id;
ALTER TABLE orders ADD COLUMN guest_last_name VARCHAR(100) NULL AFTER guest_first_name;
ALTER TABLE orders ADD COLUMN guest_email VARCHAR(150) NULL AFTER guest_last_name;
ALTER TABLE orders ADD COLUMN guest_phone VARCHAR(20) NULL AFTER guest_email;
ALTER TABLE orders ADD COLUMN delivery_method ENUM('delivery', 'pickup') DEFAULT 'delivery' AFTER total_amount;
ALTER TABLE orders ADD COLUMN delivery_address_snapshot JSON NULL AFTER delivery_method;

-- 2. Create Delivery Zones
DROP TABLE IF EXISTS delivery_zones;
CREATE TABLE delivery_zones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL UNIQUE,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  minimum_order_amount DECIMAL(10,2) DEFAULT 0.00,
  free_delivery_threshold DECIMAL(10,2) NULL,
  estimated_delivery_minutes INT DEFAULT 45,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Seed Data
INSERT INTO delivery_zones (name, postal_code, delivery_fee, free_delivery_threshold, estimated_delivery_minutes, is_active)
VALUES 
('Zone A - Core', '422001', 50.00, 1000.00, 30, TRUE),
('Zone B - Extended', '422002', 80.00, 1500.00, 60, TRUE),
('Zone C - Inactive', '422003', 100.00, NULL, 90, FALSE);
