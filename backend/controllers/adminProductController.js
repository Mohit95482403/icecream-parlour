const db = require('../config/db');

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const adminProductController = {
  // Get all products with filters, search, sort, and pagination
  getProducts: async (req, res) => {
    try {
      const { search = '', category = 'all', status = 'all', stock = 'all', sort = 'newest', page = 1, limit = 20 } = req.query;
      
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = [10, 20, 50, 100].includes(parseInt(limit, 10)) ? parseInt(limit, 10) : 20;
      const offset = (pageNum - 1) * limitNum;

      let whereClause = "1=1";
      const queryParams = [];

      // Search
      if (search) {
        whereClause += " AND (p.name LIKE ? OR c.name LIKE ? OR v.sku LIKE ?)";
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      // Category
      if (category && category !== 'all') {
        whereClause += " AND p.category_id = ?";
        queryParams.push(category);
      }

      // Status
      if (status && status !== 'all') {
        whereClause += " AND p.status = ?";
        queryParams.push(status);
      }

      // Stock
      if (stock === 'in_stock') {
        whereClause += " AND i.quantity > 0";
      } else if (stock === 'low_stock') {
        whereClause += " AND i.quantity > 0 AND i.quantity <= 10";
      } else if (stock === 'out_of_stock') {
        whereClause += " AND (i.quantity = 0 OR i.quantity IS NULL)";
      }

      // Sorting
      let orderBy = "p.created_at DESC";
      switch (sort) {
        case 'oldest': orderBy = "p.created_at ASC"; break;
        case 'name_asc': orderBy = "p.name ASC"; break;
        case 'name_desc': orderBy = "p.name DESC"; break;
        case 'price_asc': orderBy = "v.price ASC"; break;
        case 'price_desc': orderBy = "v.price DESC"; break;
        case 'stock_asc': orderBy = "i.quantity ASC"; break;
        case 'stock_desc': orderBy = "i.quantity DESC"; break;
        case 'newest':
        default: orderBy = "p.created_at DESC"; break;
      }

      // Base query parts
      const fromJoins = `
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_variants v ON p.id = v.product_id
        LEFT JOIN inventory i ON v.id = i.variant_id
        LEFT JOIN (
          SELECT product_id, image_url
          FROM product_images
          WHERE sort_order = 0 OR sort_order IS NULL
          GROUP BY product_id
        ) img ON p.id = img.product_id
      `;

      // Get Total Count
      const [countResult] = await db.query(`SELECT COUNT(DISTINCT p.id) as total ${fromJoins} WHERE ${whereClause}`, queryParams);
      const total = countResult[0].total;

      // Get Paginated Data
      const query = `
        SELECT 
          p.id, p.name, p.slug, p.status, p.created_at,
          c.name as category_name,
          v.price, i.quantity as stock, v.sku,
          img.image_url
        ${fromJoins}
        WHERE ${whereClause}
        GROUP BY p.id
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;

      const [products] = await db.query(query, [...queryParams, limitNum, offset]);

      return res.status(200).json({
        success: true,
        data: {
          products,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
          }
        }
      });
    } catch (error) {
      console.error('getProducts error:', error);
      res.status(500).json({ success: false, message: 'Internal server error fetching products' });
    }
  },

  // Get single product details by ID
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;

      const [products] = await db.query(`
        SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `, [id]);

      if (products.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const product = products[0];

      // Get variants and inventory
      const [variants] = await db.query(`
        SELECT v.*, i.quantity as stock_quantity 
        FROM product_variants v
        LEFT JOIN inventory i ON v.id = i.variant_id
        WHERE v.product_id = ?
      `, [id]);
      
      product.variant = variants.length > 0 ? variants[0] : null;

      // Get images
      const [images] = await db.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC', [id]);
      product.images = images;

      return res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('getProductById error:', error);
      res.status(500).json({ success: false, message: 'Internal server error fetching product details' });
    }
  },

  // Create a new product
  createProduct: async (req, res) => {
    const connection = await db.getConnection();
    try {
      const { 
        name, description, category_id, status = 'active',
        price, compare_at_price, stock, sku,
        images = []
      } = req.body;

      // Validation
      if (!name || name.trim() === '') return res.status(400).json({ success: false, message: 'Product name is required' });
      if (!category_id) return res.status(400).json({ success: false, message: 'Category is required' });
      if (price === undefined || isNaN(price) || price < 0) return res.status(400).json({ success: false, message: 'Valid price is required' });
      if (stock === undefined || isNaN(stock) || stock < 0) return res.status(400).json({ success: false, message: 'Valid stock quantity is required' });

      // Verify Category
      const [categories] = await connection.query('SELECT id FROM categories WHERE id = ?', [category_id]);
      if (categories.length === 0) {
        connection.release();
        return res.status(400).json({ success: false, message: 'Invalid category selected' });
      }

      const slug = generateSlug(name);
      const [existing] = await connection.query('SELECT id FROM products WHERE slug = ?', [slug]);
      if (existing.length > 0) {
        connection.release();
        return res.status(409).json({ success: false, message: 'A product with this name already exists' });
      }

      await connection.beginTransaction();

      // Insert Product
      const [productResult] = await connection.query(
        'INSERT INTO products (category_id, name, slug, description, status) VALUES (?, ?, ?, ?, ?)',
        [category_id, name.trim(), slug, description ? description.trim() : null, status]
      );
      const productId = productResult.insertId;

      // Insert Default Variant
      const [variantResult] = await connection.query(
        'INSERT INTO product_variants (product_id, sku, name, price, compare_at_price, status) VALUES (?, ?, ?, ?, ?, ?)',
        [
          productId, 
          sku || null, 
          'Default Title', 
          parseFloat(price), 
          compare_at_price ? parseFloat(compare_at_price) : null, 
          'active'
        ]
      );
      const variantId = variantResult.insertId;

      // Insert Inventory
      await connection.query(
        'INSERT INTO inventory (variant_id, quantity) VALUES (?, ?)',
        [variantId, parseInt(stock, 10)]
      );

      // Insert Images
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await connection.query(
            'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)',
            [productId, images[i], i]
          );
        }
      }

      await connection.commit();
      connection.release();

      return res.status(201).json({
        success: true,
        message: 'Product created successfully'
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error('createProduct error:', error);
      res.status(500).json({ success: false, message: 'Internal server error creating product' });
    }
  },

  // Update a product
  updateProduct: async (req, res) => {
    const connection = await db.getConnection();
    try {
      const { id } = req.params;
      const { 
        name, description, category_id, status,
        price, compare_at_price, stock, sku,
        images
      } = req.body;

      const [products] = await connection.query('SELECT * FROM products WHERE id = ?', [id]);
      if (products.length === 0) {
        connection.release();
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const currentProduct = products[0];

      await connection.beginTransaction();

      // Handle Product base update
      let newName = currentProduct.name;
      let newSlug = currentProduct.slug;

      if (name && name.trim() !== '' && name.trim() !== currentProduct.name) {
        newName = name.trim();
        newSlug = generateSlug(newName);
        const [existing] = await connection.query('SELECT id FROM products WHERE slug = ? AND id != ?', [newSlug, id]);
        if (existing.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(409).json({ success: false, message: 'A product with this name already exists' });
        }
      }

      if (category_id && category_id !== currentProduct.category_id) {
        const [categories] = await connection.query('SELECT id FROM categories WHERE id = ?', [category_id]);
        if (categories.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ success: false, message: 'Invalid category selected' });
        }
      }

      await connection.query(
        'UPDATE products SET category_id = ?, name = ?, slug = ?, description = ?, status = ? WHERE id = ?',
        [
          category_id || currentProduct.category_id,
          newName,
          newSlug,
          description !== undefined ? description.trim() : currentProduct.description,
          status || currentProduct.status,
          id
        ]
      );

      // Handle Variant update (Price/Stock)
      if (price !== undefined || stock !== undefined || sku !== undefined || compare_at_price !== undefined) {
        const [variants] = await connection.query('SELECT id FROM product_variants WHERE product_id = ? ORDER BY id ASC LIMIT 1', [id]);
        
        if (variants.length > 0) {
          const variantId = variants[0].id;
          
          let updateVariantParts = [];
          let variantParams = [];

          if (price !== undefined) { updateVariantParts.push('price = ?'); variantParams.push(parseFloat(price)); }
          if (compare_at_price !== undefined) { updateVariantParts.push('compare_at_price = ?'); variantParams.push(compare_at_price ? parseFloat(compare_at_price) : null); }
          if (sku !== undefined) { updateVariantParts.push('sku = ?'); variantParams.push(sku); }

          if (updateVariantParts.length > 0) {
            variantParams.push(variantId);
            await connection.query(`UPDATE product_variants SET ${updateVariantParts.join(', ')} WHERE id = ?`, variantParams);
          }

          // Handle Inventory update
          if (stock !== undefined) {
            const [inv] = await connection.query('SELECT id FROM inventory WHERE variant_id = ?', [variantId]);
            if (inv.length > 0) {
              await connection.query('UPDATE inventory SET quantity = ? WHERE variant_id = ?', [parseInt(stock, 10), variantId]);
            } else {
              await connection.query('INSERT INTO inventory (variant_id, quantity) VALUES (?, ?)', [variantId, parseInt(stock, 10)]);
            }
          }
        }
      }

      // Handle Images update
      if (images !== undefined) {
        await connection.query('DELETE FROM product_images WHERE product_id = ?', [id]);
        if (images.length > 0) {
          for (let i = 0; i < images.length; i++) {
            await connection.query(
              'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)',
              [id, images[i], i]
            );
          }
        }
      }

      await connection.commit();
      connection.release();

      return res.status(200).json({
        success: true,
        message: 'Product updated successfully'
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error('updateProduct error:', error);
      res.status(500).json({ success: false, message: 'Internal server error updating product' });
    }
  },

  // Update product status
  updateProductStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'archived'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }

      const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
      if (products.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      await db.query('UPDATE products SET status = ? WHERE id = ?', [status, id]);

      return res.status(200).json({
        success: true,
        message: `Product ${status} successfully`
      });
    } catch (error) {
      console.error('updateProductStatus error:', error);
      res.status(500).json({ success: false, message: 'Internal server error updating product status' });
    }
  }
};

module.exports = adminProductController;
