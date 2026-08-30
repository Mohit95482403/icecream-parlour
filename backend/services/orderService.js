const db = require('../config/db');

class OrderService {
  /**
   * Generates a unique, human-friendly order number.
   * Format: ICE-YYYYMMDD-XXXX
   */
  generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    
    return `ICE-${year}${month}${day}-${random}`;
  }

  /**
   * Creates a real order atomically with items and initial payment record.
   */
  async createOrder(orderData, items) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const orderNumber = this.generateOrderNumber();
      
      // 1. Validate and deduct inventory
      for (const item of items) {
        // 1. Deduct from total quantity immediately with an atomic update
        const [updateResult] = await connection.query(
          'UPDATE inventory SET quantity = quantity - ? WHERE variant_id = ? AND (quantity - reserved_quantity) >= ?',
          [item.quantity, item.variantId, item.quantity]
        );

        if (updateResult.affectedRows === 0) {
          // If 0 rows affected, either variant doesn't exist or stock is insufficient.
          const [inv] = await connection.query(
            'SELECT quantity, reserved_quantity FROM inventory WHERE variant_id = ?',
            [item.variantId]
          );
          
          if (inv.length === 0) {
            const error = new Error(`Inventory record not found for variant ${item.variantId}`);
            error.code = 'INVENTORY_NOT_FOUND';
            throw error;
          } else {
            const available = inv[0].quantity - inv[0].reserved_quantity;
            const error = new Error(`Insufficient stock for ${item.productName}. Only ${available} available.`);
            error.code = 'INSUFFICIENT_STOCK';
            throw error;
          }
        }
        
        // Log transaction
        await connection.query(
          `INSERT INTO inventory_transactions 
            (variant_id, type, quantity, reference_type, reference_id, note) 
           VALUES (?, 'sale', ?, 'order', ?, ?)`,
          [item.variantId, -item.quantity, orderNumber, `Order created: ${orderNumber}`]
        );
      }
      
      // 2. Insert Order
      const isFullyPaid = orderData.grandTotal === 0 && (orderData.giftCardAmount || 0) > 0;
      const initialPaymentStatus = isFullyPaid ? 'paid' : 'pending';
      const initialOrderStatus = isFullyPaid ? 'processing' : 'pending';

      const orderSql = `
        INSERT INTO orders (
          order_number, user_id, guest_first_name, guest_last_name, guest_email, guest_phone,
          subtotal, discount_amount, gift_card_amount, gift_card_id, delivery_fee, tax_amount, total_amount,
          delivery_method, delivery_address_snapshot, coupon_code, payment_status, order_status, notes,
          is_gift_order, gift_recipient_name, gift_recipient_phone, gift_recipient_address,
          gift_recipient_city, gift_recipient_state, gift_recipient_postal_code, gift_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      // For gift orders, build delivery_address_snapshot from recipient info
      let deliveryAddressSnapshot = orderData.deliveryAddress || {};
      if (orderData.isGiftOrder) {
        deliveryAddressSnapshot = {
          fullName: orderData.giftRecipientName,
          phone: orderData.giftRecipientPhone,
          addressLine1: orderData.giftRecipientAddress,
          city: orderData.giftRecipientCity,
          state: orderData.giftRecipientState,
          postalCode: orderData.giftRecipientPostalCode,
          country: 'India'
        };
      }

      const orderValues = [
        orderNumber,
        orderData.userId || null,
        orderData.guestFirstName || null,
        orderData.guestLastName || null,
        orderData.guestEmail || null,
        orderData.guestPhone || null,
        orderData.subtotal,
        orderData.discountAmount || 0,
        orderData.giftCardAmount || 0,
        orderData.giftCardId || null,
        orderData.deliveryFee || 0,
        orderData.taxAmount || 0,
        orderData.grandTotal,
        orderData.deliveryMethod || 'delivery',
        JSON.stringify(deliveryAddressSnapshot),
        orderData.couponCode || null,
        initialPaymentStatus,
        initialOrderStatus,
        orderData.notes || null,
        orderData.isGiftOrder ? 1 : 0,
        orderData.isGiftOrder ? orderData.giftRecipientName : null,
        orderData.isGiftOrder ? orderData.giftRecipientPhone : null,
        orderData.isGiftOrder ? orderData.giftRecipientAddress : null,
        orderData.isGiftOrder ? orderData.giftRecipientCity : null,
        orderData.isGiftOrder ? orderData.giftRecipientState : null,
        orderData.isGiftOrder ? orderData.giftRecipientPostalCode : null,
        orderData.isGiftOrder ? (orderData.giftMessage || null) : null
      ];

      const [orderResult] = await connection.query(orderSql, orderValues);
      const orderId = orderResult.insertId;

      // 2.5. Atomically debit Gift Card balance if applied
      if (orderData.giftCardId && orderData.giftCardAmount > 0) {
        const giftCardService = require('./giftCardService');
        await giftCardService.applyToOrder(
          orderData.giftCardId,
          orderId,
          orderData.giftCardAmount,
          orderData.userId,
          connection
        );
      }

      // 3. Insert Order Items (with historical price and names)
      if (items && items.length > 0) {
        const itemSql = `
          INSERT INTO order_items (
            order_id, product_id, variant_id, product_name, variant_name, 
            sku, quantity, unit_price, line_total
          ) VALUES ?
        `;
        
        const itemValues = items.map(item => [
          orderId,
          item.productId,
          item.variantId,
          item.productName,
          item.variantName,
          item.sku,
          item.quantity,
          item.price, // historical snapshot price
          item.price * item.quantity // line total
        ]);

        await connection.query(itemSql, [itemValues]);
      }

      // Record coupon usage if applicable
      if (orderData.couponCode && orderData.couponId) {
        const couponUsageSql = `
          INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_applied)
          VALUES (?, ?, ?, ?)
        `;
        await connection.query(couponUsageSql, [
          orderData.couponId,
          orderData.userId || null,
          orderId,
          orderData.discountAmount
        ]);
      }

      // 4. Create Payment Record with unique transaction reference
      const txnDate = new Date();
      const txnY = txnDate.getFullYear();
      const txnM = String(txnDate.getMonth() + 1).padStart(2, '0');
      const txnD = String(txnDate.getDate()).padStart(2, '0');
      const txnRand = Math.random().toString(36).substring(2, 8).toUpperCase();
      const transactionReference = `PAY-${txnY}${txnM}${txnD}-${txnRand}`;

      if (isFullyPaid) {
        // Zero-amount order fully settled by gift card
        const paymentSql = `
          INSERT INTO payments (
            order_id, gateway, payment_method, transaction_reference, amount, currency, status, paid_at
          ) VALUES (?, 'gift_card', 'gift_card', ?, 0.00, 'INR', 'paid', NOW())
        `;
        await connection.query(paymentSql, [orderId, transactionReference]);
      } else {
        const paymentSql = `
          INSERT INTO payments (
            order_id, gateway, transaction_reference, amount, currency, status
          ) VALUES (?, 'internal', ?, ?, 'INR', 'pending')
        `;
        await connection.query(paymentSql, [orderId, transactionReference, orderData.grandTotal]);
      }

      await connection.commit();
      
      // Notify admins
      const notificationService = require('./notificationService');
      const giftLabel = orderData.isGiftOrder ? ' 🎁 GIFT ORDER' : '';
      const giftRecipientInfo = orderData.isGiftOrder ? ` (Gift to ${orderData.giftRecipientName})` : '';
      await notificationService.notifyAdmins(
        'NEW_ORDER',
        `New Order Received${giftLabel}`,
        `Order ${orderNumber} has been placed for ₹${orderData.grandTotal}${giftRecipientInfo}${orderData.giftCardAmount > 0 ? ` (₹${orderData.giftCardAmount} paid via Gift Card)` : ''}.`,
        { orderId, orderNumber }
      );
      
      // Notify customer
      if (orderData.userId) {
        await notificationService.createNotification(
          orderData.userId,
          orderId,
          isFullyPaid ? 'payment_success' : 'order_placed',
          isFullyPaid ? 'Order Confirmed' : 'Order Placed',
          isFullyPaid 
            ? `Your order #${orderNumber} has been fully paid with your Gift Card and is being processed.`
            : `Your order #${orderNumber} has been placed successfully.`,
          { orderNumber, transactionReference }
        );
      }
      
      return {
        id: orderId,
        orderNumber: orderNumber,
        grandTotal: orderData.grandTotal,
        giftCardAmount: orderData.giftCardAmount || 0,
        status: isFullyPaid ? 'paid' : 'pending',
        isFullyPaid
      };
      
    } catch (error) {
      await connection.rollback();
      console.error('Transaction failed during createOrder:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Legacy wrapper for Day 5 backwards compatibility during refactor.
   */
  async createOrderDraft(orderData, items) {
    return this.createOrder(orderData, items);
  }

  /**
   * Get complete order tracking details
   */
  async getOrderTracking(orderNumber, customerId) {
    const [orders] = await db.query(
      `SELECT id, order_number as orderNumber, order_status as status, total_amount as total, created_at as createdAt,
              is_gift_order as isGiftOrder, gift_recipient_name as giftRecipientName,
              gift_recipient_address as giftRecipientAddress, gift_recipient_city as giftRecipientCity,
              gift_recipient_postal_code as giftRecipientPostalCode
       FROM orders WHERE order_number = ? AND user_id = ? AND EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = orders.id)`,
      [orderNumber, customerId]
    );

    if (orders.length === 0) {
      throw new Error('Order not found or unauthorized');
    }

    const order = orders[0];
    const orderId = order.id;

    // Timeline history
    const [history] = await db.query(
      `SELECT new_status as status, created_at as timestamp 
       FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC`,
      [orderId]
    );

    // Delivery details
    const [deliveries] = await db.query(
      `SELECT d.status, dp.name as agent_name, dp.phone as agent_phone
       FROM deliveries d
       LEFT JOIN delivery_partners dp ON d.delivery_partner_id = dp.id
       WHERE d.order_id = ?`,
      [orderId]
    );

    const timeline = this.buildTimeline(order.status, history);

    return {
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        total: order.total,
        isGiftOrder: order.isGiftOrder === 1,
        giftRecipientName: order.giftRecipientName,
        giftRecipientAddress: order.giftRecipientAddress,
        giftRecipientCity: order.giftRecipientCity,
        giftRecipientPostalCode: order.giftRecipientPostalCode
      },
      timeline,
      delivery: deliveries.length > 0 ? deliveries[0] : null
    };
  }

  /**
   * Build the structured timeline
   */
  buildTimeline(currentStatus, history) {
    const baseFlow = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
    
    // For pending/cancelled, timeline behaves differently. 
    // Here we focus on the standard flow.
    const timeline = baseFlow.map(status => {
      const historyEvent = history.find(h => h.status === status);
      const isCompleted = !!historyEvent || baseFlow.indexOf(status) < baseFlow.indexOf(currentStatus);
      const isCurrent = status === currentStatus;
      
      return {
        status,
        completed: isCompleted,
        current: isCurrent,
        timestamp: historyEvent ? historyEvent.timestamp : null
      };
    });

    return timeline;
  }

  /**
   * Cancel an order if eligible
   */
  async cancelOrder(orderNumber, customerId, reason) {
    const [orders] = await db.query(
      'SELECT id, order_status FROM orders WHERE order_number = ? AND user_id = ?',
      [orderNumber, customerId]
    );

    if (orders.length === 0) {
      throw new Error('Order not found or unauthorized');
    }

    const order = orders[0];
    const orderEventService = require('./orderEventService');

    if (!orderEventService.canCustomerCancel(order.order_status)) {
      throw new Error('Order cannot be cancelled at this stage');
    }

    await orderEventService.transitionOrderStatus(
      order.id, 
      orderNumber, 
      customerId, 
      'cancelled', 
      'customer', 
      customerId, 
      reason
    );

    return { success: true, status: 'cancelled' };
  }

  /**
   * Reorder items from a previous order (Buy Again).
   * Validates live product status, variant status, current inventory, and authoritative price.
   */
  async processBuyAgain(orderNumber, customerId) {
    // 1. Authorize order ownership (IDOR Protection)
    const [orders] = await db.query(
      'SELECT id, order_number, user_id, order_status FROM orders WHERE (order_number = ? OR id = ?) AND user_id = ?',
      [orderNumber, orderNumber, customerId]
    );

    if (orders.length === 0) {
      const error = new Error('Order not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    const order = orders[0];
    const orderId = order.id;

    // 2. Fetch original order items joined with authoritative live product, variant, inventory, and image data
    const query = `
      SELECT 
        oi.id as order_item_id,
        oi.product_id as old_product_id,
        oi.variant_id as old_variant_id,
        oi.product_name as original_product_name,
        oi.variant_name as original_variant_name,
        oi.sku as original_sku,
        oi.quantity as requested_quantity,
        oi.unit_price as original_unit_price,
        v.id as current_variant_id,
        v.product_id as current_variant_product_id,
        v.name as current_variant_name,
        v.size as current_variant_size,
        v.price as current_variant_price,
        v.sku as current_variant_sku,
        v.status as current_variant_status,
        p.id as current_product_id,
        p.name as current_product_name,
        p.slug as current_product_slug,
        p.status as current_product_status,
        i.quantity as inventory_quantity,
        i.reserved_quantity as inventory_reserved_quantity,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as current_image_url
      FROM order_items oi
      LEFT JOIN product_variants v ON oi.variant_id = v.id
      LEFT JOIN products p ON COALESCE(v.product_id, oi.product_id) = p.id
      LEFT JOIN inventory i ON v.id = i.variant_id
      WHERE oi.order_id = ?
    `;

    const [orderItems] = await db.query(query, [orderId]);

    const addedItems = [];
    const adjustedItems = [];
    const unavailableItems = [];

    if (orderItems.length === 0) {
      return {
        orderNumber: order.order_number,
        items: [],
        addedItems: [],
        adjustedItems: [],
        unavailableItems: [],
        totalRequestedCount: 0,
        totalAddedCount: 0,
        message: 'This order has no items to reorder.'
      };
    }

    for (let item of orderItems) {
      let displayName = item.current_product_name || item.original_product_name || 'Item';
      let variantName = item.current_variant_size || item.current_variant_name || item.original_variant_name || 'Standard';

      // Fallback 1: If current_variant_id is missing but SKU exists, attempt SKU lookup
      if (!item.current_variant_id && item.original_sku) {
        const [skuVariants] = await db.query(`
          SELECT v.id as current_variant_id, v.product_id as current_variant_product_id,
                 v.name as current_variant_name, v.size as current_variant_size,
                 v.price as current_variant_price, v.sku as current_variant_sku,
                 v.status as current_variant_status,
                 p.id as current_product_id, p.name as current_product_name,
                 p.slug as current_product_slug, p.status as current_product_status,
                 i.quantity as inventory_quantity, i.reserved_quantity as inventory_reserved_quantity,
                 (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as current_image_url
          FROM product_variants v
          JOIN products p ON v.product_id = p.id
          LEFT JOIN inventory i ON v.id = i.variant_id
          WHERE v.sku = ?
          LIMIT 1
        `, [item.original_sku]);

        if (skuVariants.length > 0) {
          item = { ...item, ...skuVariants[0] };
          displayName = item.current_product_name || displayName;
          variantName = item.current_variant_size || item.current_variant_name || variantName;
        }
      }

      // Fallback 2: If product exists but variant_id is missing (Case B: order without variant_id),
      // match using the Shop/Product Details logic (first available in-stock variant, or first active variant)
      if (item.current_product_id && !item.current_variant_id) {
        const [productVariants] = await db.query(`
          SELECT v.id as current_variant_id, v.product_id as current_variant_product_id,
                 v.name as current_variant_name, v.size as current_variant_size,
                 v.price as current_variant_price, v.sku as current_variant_sku,
                 v.status as current_variant_status,
                 i.quantity as inventory_quantity, i.reserved_quantity as inventory_reserved_quantity
          FROM product_variants v
          LEFT JOIN inventory i ON v.id = i.variant_id
          WHERE v.product_id = ? AND v.status = 'active'
          ORDER BY (COALESCE(i.quantity, 0) - COALESCE(i.reserved_quantity, 0)) DESC, v.price ASC
          LIMIT 1
        `, [item.current_product_id]);

        if (productVariants.length > 0) {
          item = { ...item, ...productVariants[0] };
          variantName = item.current_variant_size || item.current_variant_name || variantName;
        }
      }

      // Check product existence
      if (!item.current_product_id) {
        unavailableItems.push({
          productId: item.old_product_id,
          variantId: item.old_variant_id,
          name: displayName,
          variantName,
          reason: `"${displayName}" is no longer available in the catalog.`,
          code: 'PRODUCT_DELETED'
        });
        continue;
      }

      // Check product status
      if (item.current_product_status !== 'active') {
        unavailableItems.push({
          productId: item.current_product_id,
          variantId: item.old_variant_id,
          name: displayName,
          variantName,
          reason: `"${displayName}" is currently inactive.`,
          code: 'PRODUCT_INACTIVE'
        });
        continue;
      }

      // Check variant existence
      if (!item.current_variant_id) {
        unavailableItems.push({
          productId: item.current_product_id,
          variantId: item.old_variant_id,
          name: displayName,
          variantName,
          reason: `The variant "${variantName}" for "${displayName}" is no longer available.`,
          code: 'VARIANT_DELETED'
        });
        continue;
      }

      // Check variant status
      if (item.current_variant_status !== 'active') {
        unavailableItems.push({
          productId: item.current_product_id,
          variantId: item.current_variant_id,
          name: displayName,
          variantName,
          reason: `The variant "${variantName}" for "${displayName}" is currently unavailable.`,
          code: 'VARIANT_INACTIVE'
        });
        continue;
      }

      // Check live authoritative inventory
      const availableStock = Math.max(0, (item.inventory_quantity || 0) - (item.inventory_reserved_quantity || 0));

      if (availableStock <= 0) {
        unavailableItems.push({
          productId: item.current_product_id,
          variantId: item.current_variant_id,
          name: displayName,
          variantName,
          reason: `"${displayName} (${variantName})" is currently out of stock.`,
          code: 'OUT_OF_STOCK'
        });
        continue;
      }

      const requestedQty = Math.max(1, parseInt(item.requested_quantity) || 1);
      let finalQty = requestedQty;
      let wasAdjusted = false;

      // Quantity capping to available stock
      if (requestedQty > availableStock) {
        finalQty = availableStock;
        wasAdjusted = true;

        adjustedItems.push({
          productId: item.current_product_id,
          variantId: item.current_variant_id,
          name: displayName,
          variantName,
          requestedQuantity: requestedQty,
          addedQuantity: finalQty,
          reason: `"${displayName} (${variantName})" quantity was reduced to ${finalQty} because only ${finalQty} are available in stock.`
        });
      }

      // Current authoritative price
      const livePrice = parseFloat(item.current_variant_price) || 0;

      addedItems.push({
        productId: item.current_product_id,
        variantId: item.current_variant_id,
        slug: item.current_product_slug,
        name: item.current_product_name,
        variantName,
        sku: item.current_variant_sku,
        price: livePrice,
        image: item.current_image_url || null,
        quantity: finalQty,
        requestedQuantity: requestedQty,
        availableStock,
        wasAdjusted
      });
    }

    // Build human-friendly response message
    let message = '';
    if (addedItems.length > 0 && unavailableItems.length === 0 && adjustedItems.length === 0) {
      message = `${addedItems.length} item${addedItems.length > 1 ? 's' : ''} added to your cart.`;
    } else if (addedItems.length > 0) {
      const parts = [`${addedItems.length} item${addedItems.length > 1 ? 's were' : ' was'} added to your cart.`];
      if (adjustedItems.length > 0) {
        parts.push(`${adjustedItems.length} item quantity was adjusted due to stock limits.`);
      }
      if (unavailableItems.length > 0) {
        parts.push(`${unavailableItems.length} unavailable item${unavailableItems.length > 1 ? 's were' : ' was'} skipped.`);
      }
      message = parts.join(' ');
    } else {
      message = 'None of the items from this order are currently available to reorder.';
    }

    return {
      orderNumber: order.order_number,
      items: addedItems, // Items to merge into cart
      addedItems,
      adjustedItems,
      unavailableItems,
      totalRequestedCount: orderItems.length,
      totalAddedCount: addedItems.length,
      message
    };
  }

  /**
   * Legacy wrapper for backwards compatibility
   */
  async getReorderItems(orderNumber, customerId) {
    const result = await this.processBuyAgain(orderNumber, customerId);
    return result.items.map(item => ({
      ...item,
      isAvailable: true,
      productActive: true,
      productStatus: 'active',
      availableQuantity: item.availableStock
    }));
  }
}

module.exports = new OrderService();
