-- ===============================================================================
-- ICE CREAM PLATFORM - DATABASE SCHEMA
-- ===============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------------------------
-- 1. USERS & ACCESS
-- -------------------------------------------------------------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') DEFAULT 'customer',
  status ENUM('active', 'blocked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS addresses;
CREATE TABLE addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  label VARCHAR(50), -- e.g., Home, Work
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  landmark VARCHAR(150),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------------------
-- 2. CATALOG (CATEGORIES & COLLECTIONS)
-- -------------------------------------------------------------------------------
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image VARCHAR(255),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS collections;
CREATE TABLE collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image VARCHAR(255),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------------
-- 3. PRODUCTS & VARIANTS
-- -------------------------------------------------------------------------------
DROP TABLE IF EXISTS products;
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  short_description VARCHAR(255),
  description TEXT,
  ingredients TEXT,
  allergens TEXT,
  nutrition_info TEXT,
  status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

DROP TABLE IF EXISTS product_variants;
CREATE TABLE product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100),
  size VARCHAR(50) NOT NULL, -- e.g., 100ml, 500ml
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  weight DECIMAL(10,3), -- Weight in kg for delivery calculation
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS product_images;
CREATE TABLE product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  alt_text VARCHAR(150),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS product_collections;
CREATE TABLE product_collections (
  product_id INT NOT NULL,
  collection_id INT NOT NULL,
  PRIMARY KEY (product_id, collection_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------------------
-- 4. INVENTORY
-- -------------------------------------------------------------------------------
DROP TABLE IF EXISTS inventory;
CREATE TABLE inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  variant_id INT NOT NULL UNIQUE,
  quantity INT NOT NULL DEFAULT 0,
  reserved_quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS inventory_transactions;
CREATE TABLE inventory_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  variant_id INT NOT NULL,
  type ENUM('purchase', 'sale', 'reservation', 'release', 'adjustment', 'damage', 'return', 'expired') NOT NULL,
  quantity INT NOT NULL,
  reference_type VARCHAR(50), -- e.g., order, refund, manual
  reference_id VARCHAR(100),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------------------
-- 5. CART
-- -------------------------------------------------------------------------------
DROP TABLE IF EXISTS carts;
CREATE TABLE carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT, -- NULL for guest cart
  session_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_session (session_id)
);

DROP TABLE IF EXISTS cart_items;
CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  variant_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------------------
-- 6. ORDERS & PAYMENTS
-- -------------------------------------------------------------------------------
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE, -- e.g., ICE-20260819-0001
  user_id INT NOT NULL,
  address_id INT,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  delivery_fee DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  coupon_code VARCHAR(50),
  payment_status ENUM('pending', 'paid', 'failed', 'refunded', 'partially_refunded') DEFAULT 'pending',
  order_status ENUM('pending', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL
);

DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  variant_id INT,
  product_name VARCHAR(150) NOT NULL,
  variant_name VARCHAR(100) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

DROP TABLE IF EXISTS order_status_history;
CREATE TABLE order_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INT, -- user_id of admin or customer
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

DROP TABLE IF EXISTS payments;
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  payment_reference VARCHAR(150),
  gateway VARCHAR(50) NOT NULL, -- e.g., stripe, razorpay, paypal
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status ENUM('pending', 'paid', 'failed', 'refunded', 'partially_refunded') NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------------------
-- 7. DELIVERY
-- -------------------------------------------------------------------------------
DROP TABLE IF EXISTS delivery_partners;
CREATE TABLE delivery_partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(150),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS deliveries;
CREATE TABLE deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL UNIQUE,
  delivery_partner_id INT,
  status ENUM('pending', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed', 'cancelled') DEFAULT 'pending',
  assigned_at TIMESTAMP NULL,
  picked_up_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (delivery_partner_id) REFERENCES delivery_partners(id) ON DELETE SET NULL
);

DROP TABLE IF EXISTS delivery_status_history;
CREATE TABLE delivery_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  delivery_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------------------
-- 8. PROMOTIONS & MARKETING
-- -------------------------------------------------------------------------------
DROP TABLE IF EXISTS coupons;
CREATE TABLE coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type ENUM('percentage', 'fixed', 'free_delivery') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order_amount DECIMAL(10,2) DEFAULT 0.00,
  maximum_discount_amount DECIMAL(10,2),
  usage_limit INT,
  per_user_limit INT DEFAULT 1,
  starts_at TIMESTAMP NULL DEFAULT NULL,
  expires_at TIMESTAMP NULL DEFAULT NULL,
  status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS coupon_usage;
CREATE TABLE coupon_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coupon_id INT NOT NULL,
  user_id INT NOT NULL,
  order_id INT NOT NULL,
  discount_applied DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------------------
-- 9. REVIEWS
-- -------------------------------------------------------------------------------
DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  order_id INT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(150),
  comment TEXT,
  status ENUM('pending', 'approved', 'rejected', 'hidden') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- -------------------------------------------------------------------------------
-- 10. LOYALTY
-- -------------------------------------------------------------------------------
DROP TABLE IF EXISTS loyalty_accounts;
CREATE TABLE loyalty_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  points_balance INT DEFAULT 0,
  tier VARCHAR(50) DEFAULT 'bronze',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS loyalty_transactions;
CREATE TABLE loyalty_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loyalty_account_id INT NOT NULL,
  points INT NOT NULL, -- positive for earn, negative for redeem
  transaction_type VARCHAR(50) NOT NULL, -- e.g., 'purchase', 'redemption', 'bonus'
  reference_id VARCHAR(100), -- order_id if applicable
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loyalty_account_id) REFERENCES loyalty_accounts(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------------------
-- 11. COMMUNICATIONS & LOGS
-- -------------------------------------------------------------------------------
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL, -- e.g., 'order_update', 'promo'
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  channel ENUM('email', 'sms', 'whatsapp', 'push', 'in_app') DEFAULT 'email',
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  description TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

SET FOREIGN_KEY_CHECKS = 1;
