const db = require('../config/db');

class WishlistService {
  async getWishlistByUserId(userId) {
    let [wishlists] = await db.query(`SELECT id FROM wishlists WHERE user_id = ?`, [userId]);
    
    if (wishlists.length === 0) {
      const [result] = await db.query(`INSERT INTO wishlists (user_id) VALUES (?)`, [userId]);
      wishlists = [{ id: result.insertId }];
    }
    
    const wishlistId = wishlists[0].id;

    // Get items with product details
    const [items] = await db.query(`
      SELECT 
        wi.id as wishlist_item_id,
        wi.product_id,
        wi.variant_id,
        wi.created_at as added_at,
        p.name as product_name,
        p.slug as product_slug,
        p.status as product_status,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as image,
        COALESCE(pv.name, (SELECT name FROM product_variants WHERE product_id = p.id ORDER BY price ASC LIMIT 1)) as variant_name,
        COALESCE(pv.price, (SELECT price FROM product_variants WHERE product_id = p.id ORDER BY price ASC LIMIT 1)) as variant_price,
        COALESCE(pv.status, (SELECT status FROM product_variants WHERE product_id = p.id ORDER BY price ASC LIMIT 1)) as variant_status,
        COALESCE(
          (SELECT SUM(quantity) FROM inventory WHERE variant_id = pv.id),
          (SELECT SUM(quantity) FROM inventory i JOIN product_variants v ON i.variant_id = v.id WHERE v.product_id = p.id)
        ) as inventory_quantity
      FROM wishlist_items wi
      JOIN products p ON wi.product_id = p.id
      LEFT JOIN product_variants pv ON wi.variant_id = pv.id
      WHERE wi.wishlist_id = ?
      ORDER BY wi.created_at DESC
    `, [wishlistId]);

    // Format output
    return items.map(item => ({
      id: item.wishlist_item_id,
      productId: item.product_id,
      variantId: item.variant_id,
      name: item.product_name,
      slug: item.product_slug,
      image: item.image,
      variantName: item.variant_name,
      price: item.variant_price,
      addedAt: item.added_at,
      isAvailable: item.product_status === 'active' && 
                  item.variant_status === 'active' && 
                  Number(item.inventory_quantity) > 0
    }));
  }

  async addItem(userId, productId, variantId = null) {
    let [wishlists] = await db.query(`SELECT id FROM wishlists WHERE user_id = ?`, [userId]);
    
    if (wishlists.length === 0) {
      const [result] = await db.query(`INSERT INTO wishlists (user_id) VALUES (?)`, [userId]);
      wishlists = [{ id: result.insertId }];
    }
    
    const wishlistId = wishlists[0].id;

    try {
      const [result] = await db.query(
        `INSERT INTO wishlist_items (wishlist_id, product_id, variant_id) VALUES (?, ?, ?)`,
        [wishlistId, productId, variantId]
      );
      return { success: true, id: result.insertId };
    } catch (error) {
      // 1062 is ER_DUP_ENTRY
      if (error.code === 'ER_DUP_ENTRY') {
        return { success: true, message: 'Item already in wishlist' };
      }
      throw error;
    }
  }

  async removeItem(userId, productId, variantId = null) {
    const [wishlists] = await db.query(`SELECT id FROM wishlists WHERE user_id = ?`, [userId]);
    if (wishlists.length === 0) return { success: true };
    
    const wishlistId = wishlists[0].id;

    let query = `DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?`;
    let params = [wishlistId, productId];
    
    if (variantId) {
      query += ` AND variant_id = ?`;
      params.push(variantId);
    } else {
      query += ` AND variant_id IS NULL`;
    }

    await db.query(query, params);
    return { success: true };
  }
}

module.exports = new WishlistService();
