const db = require('../config/db');

// Helper to determine status based on quantity and threshold
const getStatus = (quantity, threshold) => {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= threshold) return 'Low Stock';
  return 'In Stock';
};

exports.getInventorySummary = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(p.id) as totalProducts,
        SUM(CASE WHEN i.quantity > i.low_stock_threshold THEN 1 ELSE 0 END) as inStock,
        SUM(CASE WHEN i.quantity > 0 AND i.quantity <= i.low_stock_threshold THEN 1 ELSE 0 END) as lowStock,
        SUM(CASE WHEN i.quantity = 0 THEN 1 ELSE 0 END) as outOfStock
      FROM products p
      JOIN product_variants v ON p.id = v.product_id
      LEFT JOIN inventory i ON v.id = i.variant_id
      WHERE p.status != 'archived'
    `;
    
    const [results] = await db.query(query);
    const summary = results[0];
    
    res.json({
      success: true,
      data: {
        totalProducts: parseInt(summary.totalProducts) || 0,
        inStock: parseInt(summary.inStock) || 0,
        lowStock: parseInt(summary.lowStock) || 0,
        outOfStock: parseInt(summary.outOfStock) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory summary' });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = 'all',
      sort = 'updated_desc'
    } = req.query;

    const offset = (page - 1) * limit;
    
    let whereClause = "p.status != 'archived'";
    const queryParams = [];

    if (search) {
      whereClause += " AND (p.name LIKE ? OR v.sku LIKE ? OR c.name LIKE ?)";
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam);
    }

    if (status !== 'all') {
      if (status === 'in_stock') {
        whereClause += " AND i.quantity > i.low_stock_threshold";
      } else if (status === 'low_stock') {
        whereClause += " AND i.quantity > 0 AND i.quantity <= i.low_stock_threshold";
      } else if (status === 'out_of_stock') {
        whereClause += " AND i.quantity = 0";
      }
    }

    let orderBy = "i.updated_at DESC";
    switch (sort) {
      case 'name_asc': orderBy = "p.name ASC"; break;
      case 'name_desc': orderBy = "p.name DESC"; break;
      case 'stock_asc': orderBy = "i.quantity ASC"; break;
      case 'stock_desc': orderBy = "i.quantity DESC"; break;
      case 'updated_desc': orderBy = "i.updated_at DESC"; break;
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      JOIN product_variants v ON p.id = v.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON v.id = i.variant_id
      WHERE ${whereClause}
    `;
    
    const [countResult] = await db.query(countQuery, queryParams);
    const total = countResult[0].total;

    const dataQuery = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.status as product_status,
        v.id as variant_id,
        v.sku,
        c.name as category_name,
        i.quantity as stock,
        i.low_stock_threshold,
        i.updated_at
      FROM products p
      JOIN product_variants v ON p.id = v.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON v.id = i.variant_id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    
    const [items] = await db.query(dataQuery, [...queryParams, parseInt(limit), parseInt(offset)]);

    // Map the status for the frontend
    const mappedItems = items.map(item => ({
      ...item,
      stock_status: getStatus(item.stock || 0, item.low_stock_threshold || 10)
    }));

    res.json({
      success: true,
      data: mappedItems,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory data' });
  }
};

exports.adjustInventory = async (req, res) => {
  const { variantId } = req.params;
  const { type, quantity, reason } = req.body;
  const adminId = req.user.sub; // From requireAdmin middleware

  if (!['increase', 'decrease', 'set'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid adjustment type' });
  }

  const adjustQty = parseInt(quantity);
  if (isNaN(adjustQty) || adjustQty < 0) {
    return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
  }

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. Lock the inventory row for update to prevent concurrent modification
    const [invRows] = await connection.query(
      'SELECT id, quantity FROM inventory WHERE variant_id = ? FOR UPDATE',
      [variantId]
    );

    if (invRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Inventory record not found' });
    }

    const currentQty = invRows[0].quantity;
    let newQty = currentQty;

    // 2. Calculate new quantity
    if (type === 'increase') {
      newQty = currentQty + adjustQty;
    } else if (type === 'decrease') {
      newQty = currentQty - adjustQty;
    } else if (type === 'set') {
      newQty = adjustQty;
    }

    // 3. Prevent negative stock
    if (newQty < 0) {
      await connection.rollback();
      return res.status(422).json({ 
        success: false, 
        message: 'Insufficient stock. Cannot reduce stock below 0.' 
      });
    }

    // 4. Update the inventory
    await connection.query(
      'UPDATE inventory SET quantity = ?, updated_at = NOW() WHERE variant_id = ?',
      [newQty, variantId]
    );

    // 5. Map the reason to the enum type for inventory_transactions
    let txType = 'adjustment';
    if (reason === 'Restock' || reason === 'Supplier Delivery') txType = 'purchase';
    if (reason === 'Damaged') txType = 'damage';
    if (reason === 'Expired') txType = 'expired';

    // 6. Record transaction history
    // Since 'admin_id' is not in the schema we fetched, we use reference_type='admin', reference_id=adminId
    // note = the text reason string + " (Before: X, After: Y)"
    const noteStr = `${reason} (Stock: ${currentQty} -> ${newQty})`;
    const qtyChange = newQty - currentQty;

    await connection.query(
      `INSERT INTO inventory_transactions 
        (variant_id, type, quantity, reference_type, reference_id, note) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [variantId, txType, qtyChange, 'admin', adminId.toString(), noteStr]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: {
        variant_id: variantId,
        previous_quantity: currentQty,
        new_quantity: newQty
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Transaction Error adjusting inventory:', error);
    res.status(500).json({ success: false, message: 'Database error during inventory adjustment' });
  } finally {
    connection.release();
  }
};

exports.getInventoryHistory = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const countQuery = 'SELECT COUNT(*) as total FROM inventory_transactions WHERE variant_id = ?';
    const [countResult] = await db.query(countQuery, [variantId]);
    const total = countResult[0].total;

    const dataQuery = `
      SELECT id, type, quantity, reference_type, reference_id, note, created_at
      FROM inventory_transactions
      WHERE variant_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [items] = await db.query(dataQuery, [variantId, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory history' });
  }
};
