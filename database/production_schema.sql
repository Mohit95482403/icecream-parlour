-- ===============================================================================
-- GLACÉ ICE CREAM - AUTHORITATIVE PRODUCTION DATABASE SCHEMA (IDEMPOTENT / SAFE)
-- ===============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS & AUTHENTICATION
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  status ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. ADDRESSES
CREATE TABLE IF NOT EXISTS addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  label VARCHAR(50) NULL,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255) NULL,
  landmark VARCHAR(150) NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CATEGORIES & COLLECTIONS
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  image VARCHAR(255) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  image VARCHAR(255) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PRODUCTS & VARIANTS
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  short_description VARCHAR(255) NULL,
  description TEXT NULL,
  ingredients TEXT NULL,
  allergens TEXT NULL,
  nutrition_info TEXT NULL,
  status ENUM('draft', 'active', 'archived') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category_id (category_id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NULL,
  size VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2) NULL,
  weight DECIMAL(10,3) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_product_id (product_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  alt_text VARCHAR(150) NULL,
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_prod_img (product_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_collections (
  product_id INT NOT NULL,
  collection_id INT NOT NULL,
  PRIMARY KEY (product_id, collection_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. INVENTORY & TRANSACTIONS
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  variant_id INT NOT NULL UNIQUE,
  quantity INT NOT NULL DEFAULT 0,
  reserved_quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  variant_id INT NOT NULL,
  type ENUM('purchase', 'sale', 'reservation', 'release', 'adjustment', 'damage', 'return', 'expired') NOT NULL DEFAULT 'adjustment',
  quantity INT NOT NULL,
  reference_type VARCHAR(50) NULL,
  reference_id VARCHAR(100) NULL,
  note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_variant_txn (variant_id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. DELIVERY ZONES & PARTNERS
CREATE TABLE IF NOT EXISTS delivery_zones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NULL,
  postal_code VARCHAR(20) NOT NULL UNIQUE,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  minimum_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  free_delivery_threshold DECIMAL(10,2) NULL,
  estimated_delivery_minutes INT DEFAULT 45,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS delivery_partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150) NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. COUPONS & USAGE
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  discount_type ENUM('percentage', 'fixed', 'free_delivery') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order_amount DECIMAL(10,2) DEFAULT 0.00,
  maximum_discount_amount DECIMAL(10,2) NULL,
  usage_limit INT NULL,
  per_user_limit INT DEFAULT 1,
  starts_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupon_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coupon_id INT NOT NULL,
  user_id INT NULL,
  order_id INT NOT NULL,
  discount_applied DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_coupon (coupon_id),
  INDEX idx_coupon_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. ORDERS & ORDER ITEMS (Includes Gift Order columns)
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NULL,
  guest_first_name VARCHAR(100) NULL,
  guest_last_name VARCHAR(100) NULL,
  guest_email VARCHAR(150) NULL,
  guest_phone VARCHAR(20) NULL,
  order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
  cancellation_status VARCHAR(50) NULL,
  payment_status ENUM('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded') DEFAULT 'pending',
  delivery_method ENUM('delivery', 'pickup') NOT NULL DEFAULT 'delivery',
  delivery_address_snapshot LONGTEXT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  gift_card_amount DECIMAL(10,2) DEFAULT 0.00,
  gift_card_id INT NULL,
  coupon_code VARCHAR(50) NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT NULL,
  estimated_delivery_at TIMESTAMP NULL,
  is_gift_order TINYINT(1) DEFAULT 0,
  gift_recipient_name VARCHAR(255) NULL,
  gift_recipient_phone VARCHAR(50) NULL,
  gift_recipient_address TEXT NULL,
  gift_recipient_city VARCHAR(100) NULL,
  gift_recipient_state VARCHAR(100) NULL,
  gift_recipient_postal_code VARCHAR(20) NULL,
  gift_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_user (user_id),
  INDEX idx_order_status (order_status),
  INDEX idx_payment_status (payment_status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NULL,
  variant_id INT NULL,
  product_name VARCHAR(150) NOT NULL,
  variant_name VARCHAR(100) NULL,
  sku VARCHAR(100) NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_items (order_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  old_status VARCHAR(50) NULL,
  from_status VARCHAR(50) NULL,
  new_status VARCHAR(50) NOT NULL,
  to_status VARCHAR(50) NULL,
  changed_by INT NULL,
  reason VARCHAR(255) NULL,
  note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_hist (order_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. DELIVERIES & CANCELLATIONS
CREATE TABLE IF NOT EXISTS deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL UNIQUE,
  delivery_partner_id INT NULL,
  status ENUM('pending', 'unassigned', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed', 'cancelled') DEFAULT 'pending',
  assigned_at TIMESTAMP NULL,
  picked_up_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (delivery_partner_id) REFERENCES delivery_partners(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_cancellations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  customer_id INT NULL,
  reason VARCHAR(255) NOT NULL,
  message TEXT NULL,
  customer_message TEXT NULL,
  status ENUM('REQUESTED', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'REQUESTED',
  admin_note TEXT NULL,
  admin_reason TEXT NULL,
  reviewed_by INT NULL,
  admin_id INT NULL,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  approved_at TIMESTAMP NULL,
  rejected_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cancel_order (order_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. PAYMENTS, EVENTS & REFUNDS
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  gateway VARCHAR(50) NOT NULL DEFAULT 'demo',
  payment_method VARCHAR(50) NULL,
  gateway_order_id VARCHAR(150) NULL,
  gateway_payment_id VARCHAR(150) NULL,
  transaction_reference VARCHAR(100) UNIQUE NULL,
  payment_reference VARCHAR(100) NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status ENUM('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded') DEFAULT 'pending',
  failure_reason TEXT NULL,
  paid_at TIMESTAMP NULL,
  refund_reference VARCHAR(100) NULL,
  refund_amount DECIMAL(10,2) NULL,
  refund_status VARCHAR(50) NULL,
  refund_reason VARCHAR(255) NULL,
  refunded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payment_order (order_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  description TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payment_events_payment_id (payment_id),
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refunds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  payment_id INT NULL,
  customer_id INT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'REFUND_PENDING',
  reason VARCHAR(255) NULL,
  refund_reference VARCHAR(100) NOT NULL UNIQUE,
  processed_by INT NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_refund_order (order_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. GIFT CARDS & LEDGER
CREATE TABLE IF NOT EXISTS gift_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  pin_hash VARCHAR(255) NULL,
  initial_amount DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status ENUM('pending', 'active', 'suspended', 'exhausted', 'expired', 'cancelled', 'redeemed', 'deleted') NOT NULL DEFAULT 'pending',
  purchased_by INT NULL,
  customer_id INT NULL,
  purchase_order_id INT NULL,
  recipient_email VARCHAR(150) NULL,
  recipient_name VARCHAR(150) NULL,
  recipient_phone VARCHAR(50) NULL,
  sender_name VARCHAR(150) NULL,
  personal_message TEXT NULL,
  message TEXT NULL,
  redeemed_by INT NULL,
  redeemed_at TIMESTAMP NULL,
  activated_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_gift_card_code (code),
  INDEX idx_gift_card_cust (customer_id),
  INDEX idx_gift_card_purchased_by (purchased_by),
  FOREIGN KEY (purchased_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gift_card_id INT NOT NULL,
  order_id INT NULL,
  type ENUM('activation', 'redemption', 'refund', 'adjustment', 'expiry', 'purchase') NOT NULL,
  transaction_type ENUM('purchase', 'redemption', 'refund', 'adjustment', 'activation', 'expiry') NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NULL,
  reference_type VARCHAR(50) NULL,
  reference_id VARCHAR(100) NULL,
  description TEXT NULL,
  note VARCHAR(255) NULL,
  performed_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gc_txn (gift_card_id),
  FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. REVIEWS & WISHLIST
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  order_id INT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(150) NULL,
  comment TEXT NULL,
  status ENUM('pending', 'approved', 'rejected', 'hidden') DEFAULT 'approved',
  admin_note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_review_prod (product_id),
  INDEX idx_reviews_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wishlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_product (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. BANNERS (New Flavour Banner & Hero Banners)
CREATE TABLE IF NOT EXISTS new_flavour_banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NULL,
  badge VARCHAR(100) DEFAULT 'NEW FLAVOUR',
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  cta_text VARCHAR(100) DEFAULT 'Discover Now',
  desktop_image VARCHAR(500) NOT NULL,
  mobile_image VARCHAR(500) NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255) NULL,
  tag VARCHAR(100) DEFAULT 'NEW FLAVOUR LAUNCH',
  badge_text VARCHAR(100) DEFAULT 'LIMITED EDITION',
  description TEXT NULL,
  cta_text VARCHAR(100) DEFAULT 'Discover Flavour',
  cta_link VARCHAR(255) DEFAULT '/shop',
  image_url VARCHAR(500) NULL,
  mobile_image_url VARCHAR(500) NULL,
  accent_color VARCHAR(50) DEFAULT '#D4AF37',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. NOTIFICATIONS, SETTINGS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  customer_id INT NULL,
  order_id INT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  metadata JSON NULL,
  metadata_json TEXT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id),
  INDEX idx_notif_customer (customer_id),
  INDEX idx_notif_read (is_read),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NULL,
  setting_group VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  description TEXT NULL,
  ip_address VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. CARTS & GUEST SESSIONS
CREATE TABLE IF NOT EXISTS carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  session_id VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  variant_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
