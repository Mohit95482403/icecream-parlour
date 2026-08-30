const db = require('../config/db');

async function migrateBanner() {
  const connection = await db.getConnection();

  try {
    console.log('Connecting to database...');

    // Create new_flavour_banners table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS new_flavour_banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NULL,
        badge VARCHAR(100) DEFAULT 'NEW FLAVOUR',
        title VARCHAR(200) NOT NULL,
        description TEXT,
        cta_text VARCHAR(100) DEFAULT 'Discover Now',
        desktop_image VARCHAR(500) NOT NULL,
        mobile_image VARCHAR(500) NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_banner_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Table new_flavour_banners created / verified.');

    // Check if initial row exists
    const [existing] = await connection.query('SELECT id FROM new_flavour_banners LIMIT 1');
    if (existing.length === 0) {
      // Find Sicilian Pistachio or first product
      const [products] = await connection.query("SELECT id FROM products WHERE slug LIKE '%pistachio%' LIMIT 1");
      const defaultProductId = products.length > 0 ? products[0].id : 1;

      await connection.query(`
        INSERT INTO new_flavour_banners (
          product_id, badge, title, description, cta_text, desktop_image, mobile_image, status
        ) VALUES (
          ?,
          'NEW FLAVOUR',
          'Sicilian Pistachio Crunch',
          'Slow-churned Bronte pistachio cream layered with roasted crushed nuts and sea salt crisp.',
          'Discover Now',
          '/images/signature-collection.jpg',
          '/images/pistachio.jpg',
          'active'
        )
      `, [defaultProductId]);

      console.log('✅ Seeded default New Flavour Banner.');
    } else {
      console.log('ℹ️ Banner already exists in database.');
    }

    console.log('🎉 Banner migration finished successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

migrateBanner();
