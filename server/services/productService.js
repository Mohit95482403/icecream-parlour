const db = require('../config/db');

class ProductService {
  async getProducts(filters = {}) {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      collection,
      minPrice,
      maxPrice,
      availability,
      sort
    } = filters;

    const offset = (page - 1) * limit;
    const queryParams = [];
    const countParams = [];

    // Base SELECT
    let selectClause = `
      SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.short_description, 
        c.name as category,
        c.slug as category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as image,
        (SELECT MIN(price) FROM product_variants WHERE product_id = p.id AND status = 'active') as price,
        (SELECT SUM(quantity) FROM inventory i JOIN product_variants pv ON i.variant_id = pv.id WHERE pv.product_id = p.id AND pv.status = 'active') as total_inventory
    `;

    // Base FROM and JOINs
    let fromClause = `
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;

    // Base WHERE
    let whereClause = `WHERE p.status = 'active'`;

    // 1. Collection Filter
    if (collection) {
      fromClause += `
        INNER JOIN product_collections pc ON p.id = pc.product_id
        INNER JOIN collections col ON pc.collection_id = col.id
      `;
      whereClause += ` AND col.slug = ? AND col.status = 'active'`;
      queryParams.push(collection);
      countParams.push(collection);
    }

    // 2. Category Filter
    if (category) {
      whereClause += ` AND c.slug = ? AND c.status = 'active'`;
      queryParams.push(category);
      countParams.push(category);
    }

    // 3. Search Filter
    if (search) {
      whereClause += ` AND (p.name LIKE ? OR p.short_description LIKE ?)`;
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }

    // 4. Price Filter (using HAVING since price is a subquery/derived value)
    // Wait, HAVING runs after group by. We are not grouping.
    // In MySQL, you can't use alias in WHERE, but you can in HAVING.
    // However, for COUNT(*) query, HAVING is problematic. 
    // Let's use a derived table approach if we need price filtering.
    
    // Construct the inner query first
    const innerQuery = `${selectClause} ${fromClause} ${whereClause}`;

    // Now wrap it in an outer query for price, availability, and sorting
    let outerWhere = [];
    
    if (minPrice !== undefined) {
      outerWhere.push(`price >= ?`);
      queryParams.push(minPrice);
      countParams.push(minPrice);
    }
    
    if (maxPrice !== undefined) {
      outerWhere.push(`price <= ?`);
      queryParams.push(maxPrice);
      countParams.push(maxPrice);
    }

    if (availability === 'in-stock') {
      outerWhere.push(`total_inventory > 0`);
    } else if (availability === 'out-of-stock') {
      outerWhere.push(`total_inventory <= 0 OR total_inventory IS NULL`);
    }

    let finalWhere = outerWhere.length > 0 ? `WHERE ${outerWhere.join(' AND ')}` : '';

    // Sorting
    let orderBy = 'ORDER BY id DESC'; // Default
    if (sort) {
      switch (sort) {
        case 'price_asc': orderBy = 'ORDER BY price ASC'; break;
        case 'price_desc': orderBy = 'ORDER BY price DESC'; break;
        case 'newest': orderBy = 'ORDER BY id DESC'; break;
        case 'a-z': orderBy = 'ORDER BY name ASC'; break;
        case 'z-a': orderBy = 'ORDER BY name DESC'; break;
      }
    }

    // Count Query
    const countSql = `
      SELECT COUNT(*) as total FROM (
        ${innerQuery}
      ) as subquery
      ${finalWhere}
    `;

    // Data Query
    const dataSql = `
      SELECT * FROM (
        ${innerQuery}
      ) as subquery
      ${finalWhere}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const [countResult] = await db.query(countSql, countParams);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    const [products] = await db.query(dataSql, queryParams);

    // Format availability string for frontend
    const formattedProducts = products.map(p => ({
      ...p,
      availability: p.total_inventory > 0 ? 'In Stock' : 'Out of Stock'
    }));

    return {
      products: formattedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages
      }
    };
  }

  async getProductBySlug(slug) {
    // 1. Get base product and category
    const productSql = `
      SELECT 
        p.id, p.name, p.slug, p.short_description, p.description, 
        p.ingredients, p.allergens, p.nutrition_info, p.status,
        c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.status = 'active'
    `;
    const [productResult] = await db.query(productSql, [slug]);
    
    if (productResult.length === 0) {
      return null;
    }
    
    const product = productResult[0];

    // 2. Get images
    const imagesSql = `
      SELECT image_url, alt_text, sort_order 
      FROM product_images 
      WHERE product_id = ? 
      ORDER BY sort_order ASC
    `;
    const [imagesResult] = await db.query(imagesSql, [product.id]);

    // 3. Get variants and their inventory
    const variantsSql = `
      SELECT 
        pv.id, pv.sku, pv.name, pv.size, pv.price, pv.compare_at_price,
        i.quantity, i.reserved_quantity,
        (i.quantity - i.reserved_quantity) as available_quantity
      FROM product_variants pv
      LEFT JOIN inventory i ON pv.id = i.variant_id
      WHERE pv.product_id = ? AND pv.status = 'active'
      ORDER BY pv.price ASC
    `;
    const [variantsResult] = await db.query(variantsSql, [product.id]);

    // Calculate total availability
    let totalAvailable = 0;
    const variants = variantsResult.map(v => {
      const isAvailable = v.available_quantity > 0;
      if (isAvailable) totalAvailable += v.available_quantity;
      return {
        ...v,
        availability_status: isAvailable ? 'in_stock' : 'out_of_stock'
      };
    });

    // 4. Get collections
    const collectionsSql = `
      SELECT col.name, col.slug 
      FROM product_collections pc
      JOIN collections col ON pc.collection_id = col.id
      WHERE pc.product_id = ? AND col.status = 'active'
    `;
    const [collectionsResult] = await db.query(collectionsSql, [product.id]);

    // Assemble final normalized product object
    return {
      ...product,
      category: {
        name: product.category_name,
        slug: product.category_slug
      },
      images: imagesResult,
      variants: variants,
      collections: collectionsResult,
      availability: totalAvailable > 0 ? 'In Stock' : 'Out of Stock',
      total_inventory: totalAvailable
    };
  }

  async getRelatedProducts(slug, limit = 4) {
    // Strategy: Find products in the same category, excluding the current one.
    // Optionally join on collections to improve relevance, but category is simpler.
    const sql = `
      SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.short_description,
        c.name as category,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as image,
        (SELECT MIN(price) FROM product_variants WHERE product_id = p.id AND status = 'active') as price,
        (SELECT SUM(quantity) FROM inventory i JOIN product_variants pv ON i.variant_id = pv.id WHERE pv.product_id = p.id AND pv.status = 'active') as total_inventory
      FROM products p
      JOIN products current_p ON p.category_id = current_p.category_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE current_p.slug = ? 
        AND p.id != current_p.id 
        AND p.status = 'active'
      ORDER BY RAND()
      LIMIT ?
    `;

    const [products] = await db.query(sql, [slug, parseInt(limit)]);

    return products.map(p => ({
      ...p,
      availability: p.total_inventory > 0 ? 'In Stock' : 'Out of Stock'
    }));
  }
  async getSearchSuggestions(query) {
    const searchPattern = `%${query}%`;
    const productsSql = `
      SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.short_description,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as image,
        (SELECT MIN(price) FROM product_variants WHERE product_id = p.id AND status = 'active') as price
      FROM products p
      WHERE p.status = 'active' AND (p.name LIKE ? OR p.short_description LIKE ?)
      LIMIT 5
    `;
    const [products] = await db.query(productsSql, [searchPattern, searchPattern]);

    const collectionsSql = `
      SELECT name, slug
      FROM collections
      WHERE status = 'active' AND name LIKE ?
      LIMIT 3
    `;
    const [collections] = await db.query(collectionsSql, [searchPattern]);

    return { products, collections };
  }

  async getBestSellers(limit = 4) {
    // For now, we mock best sellers by selecting random active products
    // In a real app, we'd query order_items and group by product_id
    const sql = `
      SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.short_description,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as image,
        (SELECT MIN(price) FROM product_variants WHERE product_id = p.id AND status = 'active') as price,
        (SELECT SUM(quantity) FROM inventory i JOIN product_variants pv ON i.variant_id = pv.id WHERE pv.product_id = p.id AND pv.status = 'active') as total_inventory
      FROM products p
      WHERE p.status = 'active'
      ORDER BY RAND()
      LIMIT ?
    `;
    const [products] = await db.query(sql, [limit]);

    return products.map(p => ({
      ...p,
      availability: p.total_inventory > 0 ? 'In Stock' : 'Out of Stock'
    }));
  }

  async getNewArrivals(limit = 4) {
    const sql = `
      SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.short_description,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as image,
        (SELECT MIN(price) FROM product_variants WHERE product_id = p.id AND status = 'active') as price,
        (SELECT SUM(quantity) FROM inventory i JOIN product_variants pv ON i.variant_id = pv.id WHERE pv.product_id = p.id AND pv.status = 'active') as total_inventory
      FROM products p
      WHERE p.status = 'active'
      ORDER BY p.id DESC
      LIMIT ?
    `;
    const [products] = await db.query(sql, [limit]);

    return products.map(p => ({
      ...p,
      availability: p.total_inventory > 0 ? 'In Stock' : 'Out of Stock'
    }));
  }
}

module.exports = new ProductService();
