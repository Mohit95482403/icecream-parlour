const db = require('../config/db');

class WishlistService {
  /**
   * Get all wishlist items for a user.
   * If the user has no wishlist items, returns an empty array (never inserts empty rows).
   */
  async getWishlistByUserId(userId) {
    const [items] = await db.query(`
      SELECT 
        w.id as wishlist_item_id,
        w.product_id,
        w.created_at as added_at,
        p.name as product_name,
        p.slug as product_slug,
        p.status as product_status,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC, id ASC LIMIT 1) as image,
        (SELECT name FROM product_variants WHERE product_id = p.id AND status = 'active' ORDER BY price ASC, id ASC LIMIT 1) as variant_name,
        (SELECT price FROM product_variants WHERE product_id = p.id AND status = 'active' ORDER BY price ASC, id ASC LIMIT 1) as variant_price,
        (SELECT status FROM product_variants WHERE product_id = p.id AND status = 'active' ORDER BY price ASC, id ASC LIMIT 1) as variant_status,
        (SELECT COALESCE(SUM(quantity), 0) FROM inventory i JOIN product_variants v ON i.variant_id = v.id WHERE v.product_id = p.id AND v.status = 'active') as inventory_quantity
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [userId]);

    return items.map(item => ({
      id: item.wishlist_item_id,
      productId: item.product_id,
      name: item.product_name,
      slug: item.product_slug,
      image: item.image,
      variantName: item.variant_name || 'Standard',
      price: item.variant_price ? parseFloat(item.variant_price) : 0,
      addedAt: item.added_at,
      isAvailable: item.product_status === 'active' && 
                  item.variant_status === 'active' && 
                  Number(item.inventory_quantity) > 0
    }));
  }

  /**
   * Add a product to the user's wishlist.
   */
  async addItem(userId, productId, variantId = null) {
    const numericProductId = parseInt(productId, 10);
    if (isNaN(numericProductId)) {
      throw Object.assign(new Error('Invalid product ID'), { statusCode: 400 });
    }

    // Verify product exists
    const [products] = await db.query('SELECT id FROM products WHERE id = ?', [numericProductId]);
    if (products.length === 0) {
      throw Object.assign(new Error('Product not found'), { statusCode: 404 });
    }

    try {
      const [result] = await db.query(
        'INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)',
        [userId, numericProductId]
      );
      return { success: true, id: result.insertId };
    } catch (error) {
      // 1062 is MySQL ER_DUP_ENTRY
      if (error.code === 'ER_DUP_ENTRY') {
        return { success: true, message: 'Item already in wishlist' };
      }
      throw error;
    }
  }

  /**
   * Remove a product from the user's wishlist.
   */
  async removeItem(userId, productId, variantId = null) {
    const numericProductId = parseInt(productId, 10);
    if (isNaN(numericProductId)) {
      return { success: true };
    }

    await db.query(
      'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
      [userId, numericProductId]
    );

    return { success: true };
  }
}

module.exports = new WishlistService();
