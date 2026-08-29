const db = require('../config/db');

class CartValidationService {
  /**
   * Validates a list of client cart items against the authoritative database state.
   * Ensures products exist, are active, variants exist, and stock is sufficient.
   * Returns the authoritative cart state and a list of any issues found.
   */
  async validateCartItems(clientItems) {
    if (!Array.isArray(clientItems) || clientItems.length === 0) {
      return { items: [], issues: [{ code: 'EMPTY_CART', message: 'Cart is empty' }] };
    }

    const issues = [];
    const validItems = [];

    for (const item of clientItems) {
      const { productId, variantId, quantity } = item;
      
      // Basic validation
      if (!productId || !variantId || !quantity || quantity <= 0) {
        issues.push({ 
          code: 'INVALID_ITEM', 
          productId, 
          variantId, 
          message: 'Invalid item data provided' 
        });
        continue;
      }

      // Fetch authoritative product and variant data
      const sql = `
        SELECT 
          p.id AS product_id,
          p.name AS product_name,
          p.status AS product_status,
          v.id AS variant_id,
          v.name AS variant_name,
          v.sku,
          v.price,
          v.status AS variant_status,
          i.quantity AS total_inventory,
          i.reserved_quantity
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        LEFT JOIN inventory i ON v.id = i.variant_id
        WHERE v.id = ? AND p.id = ?
      `;

      const [rows] = await db.query(sql, [variantId, productId]);

      if (rows.length === 0) {
        issues.push({ 
          code: 'PRODUCT_NOT_FOUND', 
          productId, 
          variantId, 
          message: 'Product or variant no longer exists' 
        });
        continue;
      }

      const dbItem = rows[0];

      // Check product and variant status
      if (dbItem.product_status !== 'active' || dbItem.variant_status !== 'active') {
        issues.push({ 
          code: 'UNAVAILABLE', 
          productId, 
          variantId, 
          message: `${dbItem.product_name} (${dbItem.variant_name}) is currently unavailable` 
        });
        continue;
      }

      // Check inventory
      const availableInventory = (dbItem.total_inventory || 0) - (dbItem.reserved_quantity || 0);
      
      if (availableInventory <= 0) {
         issues.push({ 
          code: 'OUT_OF_STOCK', 
          productId, 
          variantId, 
          message: `${dbItem.product_name} (${dbItem.variant_name}) is out of stock` 
        });
        continue;
      }

      let finalQuantity = quantity;
      if (quantity > availableInventory) {
        issues.push({ 
          code: 'INSUFFICIENT_STOCK', 
          productId, 
          variantId, 
          message: `Only ${availableInventory} left in stock for ${dbItem.product_name} (${dbItem.variant_name})` 
        });
        finalQuantity = availableInventory; // Adjust to max available
      }

      // Check if price changed (client might send a price, though we don't trust it)
      if (item.clientPrice && parseFloat(item.clientPrice) !== parseFloat(dbItem.price)) {
         issues.push({ 
          code: 'PRICE_CHANGED', 
          productId, 
          variantId, 
          oldPrice: item.clientPrice,
          newPrice: parseFloat(dbItem.price),
          message: `The price of ${dbItem.product_name} (${dbItem.variant_name}) has changed` 
        });
      }

      // Add to authoritative valid items list
      validItems.push({
        productId: dbItem.product_id,
        variantId: dbItem.variant_id,
        productName: dbItem.product_name,
        variantName: dbItem.variant_name,
        sku: dbItem.sku,
        price: parseFloat(dbItem.price),
        quantity: finalQuantity,
        availableInventory: availableInventory
      });
    }

    return {
      items: validItems,
      issues
    };
  }
}

module.exports = new CartValidationService();
