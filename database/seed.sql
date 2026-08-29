-- ===============================================================================
-- ICE CREAM PLATFORM - SEED DATA
-- ===============================================================================

-- -------------------------------------------------------------------------------
-- 1. USERS
-- -------------------------------------------------------------------------------
-- Password is 'admin123' hashed with bcrypt
INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status) VALUES
('Admin', 'User', 'admin@icecream.local', '1234567890', '$2a$10$eImiTXuWVxfM37uY4JANjQ==', 'admin', 'active');
-- $2a$10$eImiTXuWVxfM37uY4JANjO... is just a placeholder. In a real app we'd use a real hash. Let's use a real one for 'password123':
-- $2b$10$yO5hH8R0Gf/x6.4t5f6F.eYmGkPZ66wzV9Z5Xm0j4wY5v2z5a6i3O
UPDATE users SET password_hash = '$2b$10$yO5hH8R0Gf/x6.4t5f6F.eYmGkPZ66wzV9Z5Xm0j4wY5v2z5a6i3O' WHERE email = 'admin@icecream.local';


-- -------------------------------------------------------------------------------
-- 2. CATEGORIES
-- -------------------------------------------------------------------------------
INSERT INTO categories (id, name, slug, description, image, status) VALUES
(1, 'Ice Cream Tubs', 'ice-cream-tubs', 'Classic and innovative flavors in take-home tubs.', 'placeholder-tubs.jpg', 'active'),
(2, 'Ice Cream Bars', 'ice-cream-bars', 'Premium ice cream coated in rich chocolate.', 'placeholder-bars.jpg', 'active'),
(3, 'Sorbets', 'sorbets', 'Dairy-free, refreshing fruit sorbets.', 'placeholder-sorbets.jpg', 'active');

-- -------------------------------------------------------------------------------
-- 3. COLLECTIONS
-- -------------------------------------------------------------------------------
INSERT INTO collections (id, name, slug, description, image, status) VALUES
(1, 'Signature', 'signature', 'Our all-time bestsellers and classic recipes.', 'placeholder-sig.jpg', 'active'),
(2, 'Seasonal', 'seasonal', 'Limited edition flavors for the current season.', 'placeholder-season.jpg', 'active'),
(3, 'Vegan', 'vegan', '100% plant-based delights.', 'placeholder-vegan.jpg', 'active');

-- -------------------------------------------------------------------------------
-- 4. PRODUCTS & VARIANTS
-- -------------------------------------------------------------------------------
-- Product 1: Belgian Chocolate
INSERT INTO products (id, category_id, name, slug, short_description, description, ingredients, allergens, status) VALUES
(1, 1, 'Belgian Chocolate', 'belgian-chocolate', 'Rich, dark Belgian chocolate ice cream.', 'Indulge in our finest dark chocolate ice cream made from 70% cocoa.', 'Milk, Cream, Sugar, Cocoa Powder, Dark Chocolate', 'Milk', 'active');

-- Variants for Product 1
INSERT INTO product_variants (id, product_id, sku, name, size, price, compare_at_price, weight) VALUES
(1, 1, 'BC-100ML', 'Belgian Chocolate 100ml', '100ml', 5.99, NULL, 0.1),
(2, 1, 'BC-500ML', 'Belgian Chocolate 500ml', '500ml', 14.99, 16.99, 0.5),
(3, 1, 'BC-1LTR', 'Belgian Chocolate 1 Litre', '1 litre', 24.99, 27.99, 1.0);

-- Product 2: Mango Sorbet
INSERT INTO products (id, category_id, name, slug, short_description, description, ingredients, allergens, status) VALUES
(2, 3, 'Alphonso Mango Sorbet', 'alphonso-mango-sorbet', 'Refreshing dairy-free mango sorbet.', 'Made with real Alphonso mangoes for a sweet and tangy tropical escape.', 'Mango Puree, Water, Sugar, Lemon Juice', 'None', 'active');

-- Variants for Product 2
INSERT INTO product_variants (id, product_id, sku, name, size, price, compare_at_price, weight) VALUES
(4, 2, 'MS-500ML', 'Mango Sorbet 500ml', '500ml', 12.99, NULL, 0.5);

-- -------------------------------------------------------------------------------
-- 5. PRODUCT COLLECTIONS
-- -------------------------------------------------------------------------------
INSERT INTO product_collections (product_id, collection_id) VALUES
(1, 1), -- Belgian Chocolate in Signature
(2, 2), -- Mango Sorbet in Seasonal
(2, 3); -- Mango Sorbet in Vegan

-- -------------------------------------------------------------------------------
-- 6. INVENTORY
-- -------------------------------------------------------------------------------
INSERT INTO inventory (variant_id, quantity, reserved_quantity, low_stock_threshold) VALUES
(1, 100, 0, 10),
(2, 50, 0, 5),
(3, 20, 0, 5),
(4, 75, 0, 10);

-- -------------------------------------------------------------------------------
-- 7. DELIVERY PARTNERS
-- -------------------------------------------------------------------------------
INSERT INTO delivery_partners (id, name, phone, email, status) VALUES
(1, 'Premium Cold Express', '800-ICE-CREAM', 'logistics@coldexpress.local', 'active');
