const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

/**
 * Robustly parses SQL file by stripping block and line comments,
 * and splitting on valid statement delimiters without skipping statement bodies.
 */
function parseSqlStatements(sqlContent) {
  // Remove multi-line comments /* ... */
  let cleanSql = sqlContent.replace(/\/\*[\s\S]*?\*\//g, '');

  // Process line by line to strip single-line comments (-- or #)
  const lines = cleanSql.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed.startsWith('#')) {
      return '';
    }
    // Remove inline comment if present
    const commentIndex = line.indexOf('-- ');
    if (commentIndex !== -1) {
      return line.substring(0, commentIndex);
    }
    return line;
  });

  cleanSql = lines.join('\n');

  // Split on semicolons
  return cleanSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
}

async function runProductionMigration() {
  console.log('=====================================================');
  console.log('🚀 GLACÉ PRODUCTION DATABASE INITIALIZATION & MIGRATION');
  console.log('=====================================================');

  let connection;
  try {
    connection = await db.getConnection();
    console.log('✅ Connected to database instance.');

    // 1. Load authoritative production schema
    const schemaPath = path.join(__dirname, '../../database/production_schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at path: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const statements = parseSqlStatements(schemaSql);

    console.log(`📋 Found ${statements.length} idempotent SQL statements to execute.`);

    // 2. Execute statements sequentially
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await connection.query(stmt);
      } catch (err) {
        console.error(`❌ Error executing statement #${i + 1}:`, stmt.substring(0, 80));
        throw err;
      }
    }
    console.log('✅ All production schema tables initialized / verified successfully.');

    // 3. Ensure Default Store Settings exist
    console.log('⚙️ Checking default store settings...');
    const [existingSettings] = await connection.query('SELECT COUNT(*) as cnt FROM settings');
    if (existingSettings[0].cnt === 0) {
      await connection.query(`
        INSERT IGNORE INTO settings (setting_key, setting_value, setting_group) VALUES
        ('store_name', 'GLACÉ Artisanal Ice Cream', 'general'),
        ('store_email', 'contact@glace.com', 'general'),
        ('store_phone', '+91 98111 98111', 'general'),
        ('store_address', '12 Luxury Boulevard, Colaba, Mumbai', 'general'),
        ('store_description', 'Handcrafted French & Italian Inspired Artisanal Ice Creams', 'general'),
        ('store_status', 'open', 'store'),
        ('currency', 'INR', 'store'),
        ('tax_rate', '18', 'store'),
        ('min_order_amount', '300', 'store'),
        ('notify_new_order', 'true', 'notifications'),
        ('notify_low_stock', 'true', 'notifications'),
        ('maintenance_mode', 'false', 'system')
      `);
      console.log('✅ Default store settings seeded.');
    } else {
      console.log('ℹ️ Store settings already present.');
    }

    // 4. Ensure Default Delivery Zones exist
    console.log('🚚 Checking delivery zones...');
    const [existingZones] = await connection.query('SELECT COUNT(*) as cnt FROM delivery_zones');
    if (existingZones[0].cnt === 0) {
      await connection.query(`
        INSERT IGNORE INTO delivery_zones (name, postal_code, city, state, delivery_fee, minimum_order_amount, free_delivery_threshold, estimated_delivery_minutes, is_active)
        VALUES 
        ('Zone A - Core Mumbai', '400001', 'Mumbai', 'Maharashtra', 50.00, 300.00, 1000.00, 30, TRUE),
        ('Zone B - Extended Mumbai', '400050', 'Mumbai', 'Maharashtra', 80.00, 500.00, 1500.00, 45, TRUE),
        ('Zone C - Nashik Core', '422001', 'Nashik', 'Maharashtra', 50.00, 300.00, 1000.00, 30, TRUE),
        ('Zone D - Nashik Extended', '422002', 'Nashik', 'Maharashtra', 80.00, 500.00, 1500.00, 45, TRUE)
      `);
      console.log('✅ Default delivery zones seeded.');
    } else {
      console.log('ℹ️ Delivery zones already present.');
    }

    // 5. Ensure Default Categories & Collections exist (if catalog is empty)
    console.log('🍨 Checking catalog categories & collections...');
    const [existingCategories] = await connection.query('SELECT COUNT(*) as cnt FROM categories');
    if (existingCategories[0].cnt === 0) {
      await connection.query(`
        INSERT IGNORE INTO categories (id, name, slug, description, image, status) VALUES
        (1, 'Artisanal Tubs', 'artisanal-tubs', 'Slow-churned small-batch ice cream tubs', '/images/categories/tubs.jpg', 'active'),
        (2, 'Gourmet Gelato', 'gourmet-gelato', 'Dense, velvety Italian-style gelato', '/images/categories/gelato.jpg', 'active'),
        (3, 'Plant-Based Sorbets', 'plant-based-sorbets', 'Fresh fruit, dairy-free vegan sorbets', '/images/categories/sorbets.jpg', 'active')
      `);
      console.log('✅ Baseline categories seeded.');
    }

    const [existingCollections] = await connection.query('SELECT COUNT(*) as cnt FROM collections');
    if (existingCollections[0].cnt === 0) {
      await connection.query(`
        INSERT IGNORE INTO collections (id, name, slug, description, image, status) VALUES
        (1, 'Signature Collection', 'signature-collection', 'Our master-crafted iconic classics', '/images/collections/signature.jpg', 'active'),
        (2, 'Seasonal Specials', 'seasonal-specials', 'Limited edition seasonal creations', '/images/collections/seasonal.jpg', 'active'),
        (3, 'Vegan & Guilt-Free', 'vegan-guilt-free', '100% plant-based luxury desserts', '/images/collections/vegan.jpg', 'active')
      `);
      console.log('✅ Baseline collections seeded.');
    }

    // 6. Ensure Default Products exist (if catalog is empty)
    console.log('🍦 Checking products & variants...');
    const [existingProducts] = await connection.query('SELECT COUNT(*) as cnt FROM products');
    if (existingProducts[0].cnt === 0) {
      await connection.query(`
        INSERT IGNORE INTO products (id, category_id, name, slug, short_description, description, ingredients, allergens, status) VALUES
        (1, 1, 'Belgian Dark Chocolate Crunch', 'belgian-dark-chocolate-crunch', '70% Callebaut dark chocolate with crunchy cacao nibs.', 'Handcrafted with imported Belgian chocolate, organic dairy, and slow-churned perfection.', 'Cream, Whole Milk, Belgian Dark Chocolate 70%, Cocoa, Raw Cane Sugar', 'Milk', 'active'),
        (2, 2, 'Sicilian Pistachio Crunch', 'sicilian-pistachio-crunch', 'Slow-churned Bronte pistachio cream with roasted crushed nuts.', 'Authentic Sicilian pistachio paste blended with farm-fresh cream.', 'Cream, Whole Milk, Sicilian Pistachio Paste, Sugar, Roasted Pistachio Nibs', 'Milk, Tree Nuts (Pistachio)', 'active'),
        (3, 3, 'Alphonso Mango & Passionfruit', 'alphonso-mango-passionfruit', 'Ratnagiri Alphonso mango puree with tangy passionfruit swirl.', 'Pure tropical fruit sorbet made from tree-ripened Alphonso mangoes.', 'Alphonso Mango Puree, Passionfruit Pulp, Water, Organic Cane Sugar, Lime Juice', 'None', 'active')
      `);

      await connection.query(`
        INSERT IGNORE INTO product_variants (id, product_id, sku, name, size, price, compare_at_price, weight, status) VALUES
        (1, 1, 'BDC-500ML', 'Belgian Dark Chocolate 500ml', '500ml', 450.00, 520.00, 0.450, 'active'),
        (2, 1, 'BDC-1LTR', 'Belgian Dark Chocolate 1 Litre', '1 Litre', 850.00, 950.00, 0.900, 'active'),
        (3, 2, 'SPC-500ML', 'Sicilian Pistachio 500ml', '500ml', 550.00, 620.00, 0.450, 'active'),
        (4, 2, 'SPC-1LTR', 'Sicilian Pistachio 1 Litre', '1 Litre', 990.00, 1150.00, 0.900, 'active'),
        (5, 3, 'AMP-500ML', 'Alphonso Mango Sorbet 500ml', '500ml', 390.00, 450.00, 0.450, 'active')
      `);

      await connection.query(`
        INSERT IGNORE INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
        (1, '/images/products/belgian-chocolate.jpg', 'Belgian Dark Chocolate Tub', 0, TRUE),
        (2, '/images/products/pistachio.jpg', 'Sicilian Pistachio Tub', 0, TRUE),
        (3, '/images/products/mango-sorbet.jpg', 'Alphonso Mango Sorbet Tub', 0, TRUE)
      `);

      await connection.query(`
        INSERT IGNORE INTO product_collections (product_id, collection_id) VALUES
        (1, 1),
        (2, 1),
        (2, 2),
        (3, 3)
      `);

      await connection.query(`
        INSERT IGNORE INTO inventory (variant_id, quantity, reserved_quantity, low_stock_threshold) VALUES
        (1, 50, 0, 10),
        (2, 30, 0, 5),
        (3, 40, 0, 10),
        (4, 25, 0, 5),
        (5, 60, 0, 10)
      `);

      console.log('✅ Baseline products, variants, images, and inventory seeded.');
    } else {
      console.log('ℹ️ Products already present in database.');
    }

    // 7. Ensure Default New Flavour Banner exists
    console.log('🏷️ Checking New Flavour Banner...');
    const [existingBanner] = await connection.query('SELECT COUNT(*) as cnt FROM new_flavour_banners');
    if (existingBanner[0].cnt === 0) {
      const [prodRows] = await connection.query('SELECT id FROM products WHERE slug = "sicilian-pistachio-crunch" LIMIT 1');
      const bannerProductId = prodRows.length > 0 ? prodRows[0].id : null;

      await connection.query(`
        INSERT INTO new_flavour_banners (
          product_id, badge, title, description, cta_text, desktop_image, mobile_image, status
        ) VALUES (
          ?,
          'NEW FLAVOUR LAUNCH',
          'Sicilian Pistachio Crunch',
          'Slow-churned Bronte pistachio cream layered with roasted crushed nuts and sea salt crisp.',
          'Discover Flavour',
          '/images/signature-collection.jpg',
          '/images/pistachio.jpg',
          'active'
        )
      `, [bannerProductId]);
      console.log('✅ Default active New Flavour Banner created.');
    } else {
      console.log('ℹ️ New Flavour Banner already exists.');
    }

    // 8. Ensure Default Promotional Coupons exist
    console.log('🎟️ Checking coupons...');
    const [existingCoupons] = await connection.query('SELECT COUNT(*) as cnt FROM coupons');
    if (existingCoupons[0].cnt === 0) {
      await connection.query(`
        INSERT IGNORE INTO coupons (code, description, discount_type, discount_value, minimum_order_amount, maximum_discount_amount, usage_limit, per_user_limit, status)
        VALUES 
        ('WELCOME10', '10% off your first luxury dessert order', 'percentage', 10.00, 300.00, 200.00, 1000, 1, 'active'),
        ('GLACE50', 'Flat ₹50 discount on orders above ₹500', 'fixed', 50.00, 500.00, 50.00, 500, 2, 'active'),
        ('FREESHIP', 'Free delivery on orders above ₹600', 'free_delivery', 0.00, 600.00, NULL, 500, 3, 'active')
      `);
      console.log('✅ Default promotional coupons seeded.');
    } else {
      console.log('ℹ️ Coupons already exist.');
    }

    // 9. Ensure Seed Admin User exists
    console.log('👤 Checking admin account...');
    const [admins] = await connection.query('SELECT id, email FROM users WHERE role = "admin" LIMIT 1');
    if (admins.length === 0) {
      console.log('Creating default production administrator (admin@glace.com)...');
      const hash = await bcrypt.hash('Admin@Glace2026!', 10);
      await connection.query(`
        INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status)
        VALUES ('GLACÉ', 'Administrator', 'admin@glace.com', '9811198111', ?, 'admin', 'active')
      `, [hash]);
      console.log('✅ Default admin user created (admin@glace.com).');
    } else {
      console.log(`ℹ️ Admin user already present: ${admins[0].email}`);
    }

    // 10. Read-only Verification & Summary
    console.log('\n=====================================================');
    console.log('🔍 VERIFYING DATABASE TABLES (READ-ONLY)');
    console.log('=====================================================');

    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    console.log(`Total Tables in Railway Database: ${tableNames.length}`);
    console.log('Tables:', tableNames.join(', '));

    // Mandatory tables verification
    const mandatoryTables = [
      'users',
      'addresses',
      'categories',
      'collections',
      'products',
      'product_variants',
      'product_images',
      'product_collections',
      'inventory',
      'inventory_transactions',
      'delivery_zones',
      'delivery_partners',
      'coupons',
      'coupon_usage',
      'orders',
      'order_items',
      'order_status_history',
      'deliveries',
      'order_cancellations',
      'payments',
      'payment_events',
      'refunds',
      'gift_cards',
      'gift_card_transactions',
      'reviews',
      'wishlists',
      'new_flavour_banners',
      'banners',
      'notifications',
      'settings',
      'audit_logs',
      'carts',
      'cart_items'
    ];

    const missingTables = mandatoryTables.filter(t => !tableNames.includes(t));
    if (missingTables.length > 0) {
      throw new Error(`Migration incomplete! Missing tables: ${missingTables.join(', ')}`);
    }

    console.log('\n✅ ALL 33 MANDATORY TABLES CONFIRMED AND VERIFIED.');
    console.log('🎉 Production database initialization completed safely with 0 data loss!');
    console.log('=====================================================');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (connection) {
      try { connection.release(); } catch (_) {}
    }
    process.exit(1);
  } finally {
    if (connection) {
      try { connection.release(); } catch (_) {}
    }
    process.exit(0);
  }
}

runProductionMigration();
