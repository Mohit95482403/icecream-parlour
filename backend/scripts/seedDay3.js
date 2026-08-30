const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars relative to server root
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'icecream_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function runSeed() {
  console.log('Starting database seed for Day 3...');
  try {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Clear existing catalogue data
      console.log('Clearing existing catalogue data...');
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.query('TRUNCATE TABLE product_collections');
      await connection.query('TRUNCATE TABLE product_images');
      await connection.query('TRUNCATE TABLE inventory_transactions');
      await connection.query('TRUNCATE TABLE inventory');
      await connection.query('TRUNCATE TABLE product_variants');
      await connection.query('TRUNCATE TABLE products');
      await connection.query('TRUNCATE TABLE collections');
      await connection.query('TRUNCATE TABLE categories');
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');

      // 1. Categories
      console.log('Inserting Categories...');
      const [catResult] = await connection.query(`
        INSERT INTO categories (id, name, slug, description, status) VALUES
        (1, 'Ice Cream', 'ice-cream', 'Classic and innovative flavors.', 'active'),
        (2, 'Gelato', 'gelato', 'Dense, rich, authentic Italian style gelato.', 'active'),
        (3, 'Sorbet', 'sorbet', 'Dairy-free, refreshing fruit sorbets.', 'active'),
        (4, 'Seasonal', 'seasonal', 'Limited time offerings.', 'active')
      `);

      // 2. Collections
      console.log('Inserting Collections...');
      const [colResult] = await connection.query(`
        INSERT INTO collections (id, name, slug, description, image, status) VALUES
        (1, 'Signature', 'signature', 'Our all-time bestsellers and classic recipes.', '/images/signature-collection.jpg', 'active'),
        (2, 'Best Sellers', 'best-sellers', 'The crowd favorites.', NULL, 'active'),
        (3, 'Dairy Free', 'dairy-free', '100% plant-based delights.', NULL, 'active')
      `);

      // 3. Products
      console.log('Inserting Products...');
      const productsData = [
        [1, 1, 'Sicilian Pistachio', 'sicilian-pistachio', 'Roasted pistachios folded into a rich, silky cream base.', 'Our signature pistachio is made with 100% pure roasted pistachios from Sicily.', 'active'],
        [2, 1, 'Belgian Chocolate', 'belgian-chocolate', 'Velvety dark chocolate from 70% single-origin cocoa.', 'Indulge in our finest dark chocolate ice cream.', 'active'],
        [3, 3, 'Alphonso Mango', 'alphonso-mango', 'Sun-ripened Alphonso mangoes turned into a bright, refreshing sorbet.', 'Made with real Alphonso mangoes.', 'active'],
        [4, 1, 'Madagascar Vanilla', 'madagascar-vanilla', 'Real vanilla beans from Madagascar, slow-churned to perfection.', 'A classic done right.', 'active'],
        [5, 1, 'Strawberry Fields', 'strawberry-fields', 'Fresh strawberries blended into a creamy, naturally pink base.', 'Summer in a scoop.', 'active'],
        [6, 2, 'Salted Caramel', 'salted-caramel', 'Buttery caramel with a whisper of Himalayan salt.', 'The perfect balance of sweet and salty.', 'active'],
        [7, 1, 'Coffee Praline', 'coffee-praline', 'Rich espresso ice cream dotted with caramelized pecans.', 'For the coffee lovers.', 'active'],
        [8, 1, 'Mint Chocolate Chip', 'mint-chocolate-chip', 'Fresh mint steeped in sweet cream with dark chocolate flakes.', 'Refreshing and crisp.', 'active'],
        [9, 2, 'Hazelnut Crunch', 'hazelnut-crunch', 'Smooth hazelnut gelato with roasted hazelnut pieces.', 'Nutty and rich.', 'active'],
        [10, 3, 'Lemon Basil', 'lemon-basil', 'Tart lemon sorbet infused with fresh sweet basil.', 'A zesty palate cleanser.', 'active'],
        [11, 4, 'Pumpkin Spice', 'pumpkin-spice', 'Warm fall spices blended with real pumpkin puree.', 'Autumn favorite.', 'active'],
        [12, 4, 'Peppermint Bark', 'peppermint-bark', 'White chocolate ice cream with crushed peppermint candies.', 'Holiday special.', 'active'],
        [13, 1, 'Cookies and Cream', 'cookies-and-cream', 'Sweet cream loaded with crushed chocolate sandwich cookies.', 'A nostalgic classic.', 'active'],
        [14, 3, 'Raspberry Sorbet', 'raspberry-sorbet', 'Vibrant, tart, and sweet raspberry sorbet.', 'Dairy-free delight.', 'active'],
        [15, 2, 'Stracciatella', 'stracciatella', 'Sweet milk gelato with delicate shards of dark chocolate.', 'An Italian classic.', 'active'],
        [16, 1, 'Butter Pecan', 'butter-pecan', 'Rich butter ice cream loaded with roasted pecans.', 'Sweet and nutty.', 'active'],
        [17, 1, 'Cherry Vanilla', 'cherry-vanilla', 'Vanilla bean ice cream studded with dark sweet cherries.', 'Fruity and creamy.', 'active'],
        [18, 3, 'Coconut Water', 'coconut-water', 'Hydrating and light coconut water sorbet.', 'Tropical refreshment.', 'active'],
        [19, 2, 'Tiramisu', 'tiramisu', 'Mascarpone gelato with espresso-soaked ladyfingers and cocoa.', 'Dessert in a scoop.', 'active'],
        [20, 1, 'Peanut Butter Cup', 'peanut-butter-cup', 'Creamy peanut butter ice cream with chocolate peanut butter cups.', 'Decadent and rich.', 'active']
      ];

      await connection.query(
        'INSERT INTO products (id, category_id, name, slug, short_description, description, status) VALUES ?',
        [productsData]
      );

      // 4. Product Variants & Inventory
      console.log('Inserting Variants and Inventory...');
      let variantIdCounter = 1;
      
      for (let i = 0; i < productsData.length; i++) {
        const productId = productsData[i][0];
        const productName = productsData[i][2];
        const basePrice = 250 + (i % 5) * 20; // Vary prices a bit
        
        // Everyone gets a 500ml
        await connection.query(`
          INSERT INTO product_variants (id, product_id, sku, name, size, price, status) 
          VALUES (?, ?, ?, ?, ?, ?, 'active')
        `, [variantIdCounter, productId, `SKU-${productId}-500ML`, `${productName} 500ml`, '500ml', basePrice]);
        
        // Set inventory - some in stock, some low, some out
        let qty = 50;
        if (i % 4 === 0) qty = 0; // Out of stock
        else if (i % 5 === 0) qty = 4; // Low stock
        
        await connection.query(`
          INSERT INTO inventory (variant_id, quantity, low_stock_threshold) 
          VALUES (?, ?, 10)
        `, [variantIdCounter, qty]);
        
        variantIdCounter++;

        // Every other gets a 1L
        if (i % 2 === 0) {
           await connection.query(`
            INSERT INTO product_variants (id, product_id, sku, name, size, price, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'active')
          `, [variantIdCounter, productId, `SKU-${productId}-1LTR`, `${productName} 1Litre`, '1 Litre', basePrice * 1.8]);
          
           await connection.query(`
            INSERT INTO inventory (variant_id, quantity, low_stock_threshold) 
            VALUES (?, ?, 10)
          `, [variantIdCounter, 20]);
           variantIdCounter++;
        }
      }

      // 5. Product Images
      console.log('Inserting Images...');
      // Use the placeholder images from Day 2 for the first few, generic for rest
      const imagesData = [
        [1, 1, '/images/pistachio.jpg', 'Sicilian Pistachio', 0],
        [2, 2, '/images/chocolate.jpg', 'Belgian Chocolate', 0],
        [3, 3, '/images/mango.jpg', 'Alphonso Mango', 0],
        [4, 4, '/images/vanilla.jpg', 'Madagascar Vanilla', 0],
        [5, 5, '/images/strawberry.jpg', 'Strawberry Fields', 0]
      ];
      
      // Fill the rest with placeholders
      for(let i = 6; i <= 20; i++) {
        const imageType = (i % 3 === 0) ? 'mango.jpg' : (i % 2 === 0 ? 'chocolate.jpg' : 'vanilla.jpg');
        imagesData.push([i, i, `/images/${imageType}`, `Product ${i}`, 0]);
      }

      await connection.query(
        'INSERT INTO product_images (id, product_id, image_url, alt_text, sort_order) VALUES ?',
        [imagesData]
      );

      // 6. Product Collections
      console.log('Inserting Product-Collection mappings...');
      const pcData = [];
      for(let i = 1; i <= 20; i++) {
        if (i <= 6) pcData.push([i, 1]); // First 6 in Signature
        if (i % 3 === 0) pcData.push([i, 2]); // Every 3rd in Best Sellers
        if ([3, 10, 14, 18].includes(i)) pcData.push([i, 3]); // Sorbets in Dairy Free
      }
      
      await connection.query(
        'INSERT INTO product_collections (product_id, collection_id) VALUES ?',
        [pcData]
      );

      await connection.commit();
      console.log('Database seeding completed successfully!');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    process.exit(0);
  }
}

runSeed();
