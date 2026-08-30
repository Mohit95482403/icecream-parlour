const db = require('../config/db');
const cartValidationService = require('../services/cartValidationService');
const deliveryService = require('../services/deliveryService');
const pricingService = require('../services/pricingService');
const orderService = require('../services/orderService');
const cancellationService = require('../services/cancellationService');

const orderController = {
  createOrder: async (req, res) => {
    try {
      // Identity can be authenticated (req.user) or guest (null)
      const userId = req.user ? req.user.sub : null;
      const { customer, address, deliveryMethod, items, notes } = req.body;

      // 0. Gift Order Validation
      const isGiftOrder = req.body.isGiftOrder === true;
      let giftData = {};
      if (isGiftOrder) {
        const gName = (req.body.giftRecipientName || '').trim();
        const gPhone = (req.body.giftRecipientPhone || '').trim();
        const gAddr = (req.body.giftRecipientAddress || '').trim();
        const gCity = (req.body.giftRecipientCity || '').trim();
        const gState = (req.body.giftRecipientState || '').trim();
        const gPostal = (req.body.giftRecipientPostalCode || '').trim();
        const gMsg = (req.body.giftMessage || '').trim();

        if (!gName || !gPhone || !gAddr || !gCity || !gState || !gPostal) {
          return res.status(400).json({ success: false, error: { code: 'GIFT_INVALID', message: 'Complete recipient information is required for gift orders.' } });
        }
        if (gName.length > 150) {
          return res.status(400).json({ success: false, error: { code: 'GIFT_INVALID', message: 'Recipient name is too long.' } });
        }
        const phoneRegex = /^[6-9]\d{9}$/;
        const normalizedPhone = gPhone.replace(/[\s\-+]/g, '').replace(/^91/, '').replace(/^0/, '');
        if (!phoneRegex.test(normalizedPhone)) {
          return res.status(400).json({ success: false, error: { code: 'GIFT_INVALID', message: 'Enter a valid recipient phone number.' } });
        }
        if (gMsg.length > 300) {
          return res.status(400).json({ success: false, error: { code: 'GIFT_INVALID', message: 'Gift message cannot exceed 300 characters.' } });
        }
        giftData = {
          isGiftOrder: true,
          giftRecipientName: gName,
          giftRecipientPhone: normalizedPhone,
          giftRecipientAddress: gAddr,
          giftRecipientCity: gCity,
          giftRecipientState: gState,
          giftRecipientPostalCode: gPostal,
          giftMessage: gMsg || null
        };
      }

      // 1. Validate Cart & Inventory
      const cartValidation = await cartValidationService.validateCartItems(items);
      if (cartValidation.issues.length > 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CART_INVALID',
            message: 'Your cart needs to be updated before checking out.',
            issues: cartValidation.issues
          }
        });
      }
      const validatedItems = cartValidation.items;

      // 2. Validate Delivery
      let finalDeliveryFee = 0;
      if (deliveryMethod === 'delivery') {
        const deliveryPostalCode = isGiftOrder ? giftData.giftRecipientPostalCode : (address && address.postalCode);
        if (!deliveryPostalCode) {
           return res.status(400).json({ success: false, error: { message: 'Postal code is required for delivery' }});
        }
        
        const serviceability = await deliveryService.checkServiceability(deliveryPostalCode);
        if (!serviceability.serviceable) {
           return res.status(400).json({ success: false, error: { message: 'We do not deliver to this postal code.' }});
        }

        const tempSubtotal = validatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const calculatedFee = deliveryService.calculateFinalDeliveryFee(serviceability, tempSubtotal);
        
        if (calculatedFee === null) {
           return res.status(400).json({ success: false, error: { message: `Minimum order amount is ₹${serviceability.minimumOrderAmount}` }});
        }
        
        finalDeliveryFee = calculatedFee;
      }

      // 3. Coupon Validation
      let finalDiscountAmount = 0;
      let appliedCouponId = null;
      let appliedCouponCode = null;

      const tempSubtotal = validatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

      if (req.body.couponCode) {
        const normalizedCode = req.body.couponCode.trim().toUpperCase();
        
        const [coupons] = await db.query('SELECT * FROM coupons WHERE code = ?', [normalizedCode]);

        if (coupons.length > 0) {
          const coupon = coupons[0];
          let isValid = true;
          let errorMessage = '';

          const now = new Date();
          if (coupon.status !== 'active') {
            isValid = false;
            errorMessage = 'This coupon is no longer available';
          } else if (coupon.starts_at && new Date(coupon.starts_at) > now) {
            isValid = false;
            errorMessage = 'This coupon is not active yet';
          } else if (coupon.expires_at && new Date(coupon.expires_at) <= now) {
            isValid = false;
            errorMessage = 'This coupon has expired';
          }

          const minOrder = parseFloat(coupon.minimum_order_amount) || 0;
          if (isValid && tempSubtotal < minOrder) {
            isValid = false;
            errorMessage = `Minimum order of ₹${minOrder} required for this coupon`;
          }

          if (isValid && coupon.usage_limit) {
            const [usageCount] = await db.query('SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ?', [coupon.id]);
            if (usageCount[0].count >= coupon.usage_limit) {
              isValid = false;
              errorMessage = 'This coupon has reached its usage limit';
            }
          }

          if (isValid && coupon.per_user_limit) {
            if (!req.user || !req.user.sub) {
              isValid = false;
              errorMessage = 'You must be logged in to use this coupon';
            } else {
              const [userUsage] = await db.query('SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?', [coupon.id, req.user.sub]);
              if (userUsage[0].count >= coupon.per_user_limit) {
                isValid = false;
                errorMessage = 'You have already used this coupon';
              }
            }
          }

          if (!isValid) {
            return res.status(400).json({ success: false, error: { message: errorMessage }});
          }

          const discountValue = parseFloat(coupon.discount_value);
          const maxDiscount = parseFloat(coupon.maximum_discount_amount);

          if (coupon.discount_type === 'percentage') {
            finalDiscountAmount = tempSubtotal * (discountValue / 100);
            if (maxDiscount > 0 && finalDiscountAmount > maxDiscount) {
              finalDiscountAmount = maxDiscount;
            }
          } else if (coupon.discount_type === 'fixed') {
            finalDiscountAmount = discountValue;
          } else if (coupon.discount_type === 'free_delivery') {
            finalDeliveryFee = 0;
            finalDiscountAmount = 0; 
          }

          if (coupon.discount_type !== 'free_delivery' && finalDiscountAmount > tempSubtotal) {
            finalDiscountAmount = tempSubtotal;
          }

          appliedCouponId = coupon.id;
          appliedCouponCode = coupon.code;
        }
      }

      // 4. Calculate Final Pricing (Authority)
      const pricing = pricingService.calculateOrderTotals({
        items: validatedItems,
        deliveryFee: finalDeliveryFee,
        discountAmount: finalDiscountAmount
      });

      // 4.5. Validate and Apply Gift Card (if provided)
      let appliedGiftCard = null;
      let giftCardDeduction = 0;

      if (req.body.giftCardCode) {
        const giftCardService = require('../services/giftCardService');
        try {
          appliedGiftCard = await giftCardService.validateForCheckout(req.body.giftCardCode, userId);
          giftCardDeduction = Math.min(appliedGiftCard.currentBalance, pricing.grandTotal);
        } catch (gcErr) {
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_GIFT_CARD', message: gcErr.message }
          });
        }
      }

      const finalPayableTotal = Math.max(0, Math.round((pricing.grandTotal - giftCardDeduction) * 100) / 100);

      // 5. Prepare Order Data
      const guestCustomer = customer || {};
      const orderData = {
        userId: userId,
        guestFirstName: !userId ? guestCustomer.firstName : null,
        guestLastName: !userId ? guestCustomer.lastName : null,
        guestEmail: !userId ? guestCustomer.email : null,
        guestPhone: !userId ? guestCustomer.phone : null,
        deliveryMethod,
        deliveryAddress: address,
        notes: notes || null,
        subtotal: pricing.subtotal,
        discountAmount: pricing.discount,
        giftCardAmount: giftCardDeduction,
        giftCardId: appliedGiftCard ? appliedGiftCard.id : null,
        deliveryFee: pricing.deliveryFee,
        taxAmount: pricing.tax,
        grandTotal: finalPayableTotal,
        couponCode: appliedCouponCode,
        couponId: appliedCouponId,
        ...giftData
      };

      // 6. Create Order Atomically
      const order = await orderService.createOrder(orderData, validatedItems);

      res.status(201).json({
        success: true,
        data: order
      });

    } catch (error) {
      console.error('Error creating order:', error);
      if (error.code === 'INSUFFICIENT_STOCK' || error.code === 'INVENTORY_NOT_FOUND') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CART_INVALID',
            message: error.message
          }
        });
      }
      res.status(500).json({ success: false, error: { message: error.message || 'Failed to create order' } });
    }
  },

  getOrders: async (req, res) => {
    try {
      const userId = req.user.sub;
      const [orders] = await db.query(
        `SELECT o.order_number, o.created_at, o.order_status, o.cancellation_status, o.payment_status, o.total_amount, o.is_gift_order 
         FROM orders o 
         WHERE o.user_id = ? 
           AND EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id)
         ORDER BY o.created_at DESC`, 
        [userId]
      );
      
      res.status(200).json({ success: true, data: { orders } });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to fetch orders' } });
    }
  },

  getOrderByNumber: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { orderNumber } = req.params;
      
      const [orders] = await db.query(
        `SELECT * FROM orders 
         WHERE (order_number = ? OR id = ?) 
           AND user_id = ? 
           AND EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = orders.id)`, 
        [orderNumber, orderNumber, userId]
      );
      
      if (orders.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Order not found' } });
      }
      
      const order = orders[0];
      
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items.map(item => ({
        ...item,
        total_price: item.line_total != null ? item.line_total : item.total_price
      }));
      try {
        order.delivery_address_snapshot = typeof order.delivery_address_snapshot === 'string'
          ? JSON.parse(order.delivery_address_snapshot || '{}')
          : (order.delivery_address_snapshot || {});
      } catch (e) {
        order.delivery_address_snapshot = {};
      }

      // Fetch cancellation request if any
      const [cancellations] = await db.query('SELECT * FROM order_cancellations WHERE order_id = ? ORDER BY requested_at DESC LIMIT 1', [order.id]);
      order.cancellation_request = cancellations.length > 0 ? cancellations[0] : null;

      // Fetch refund if any
      const [refunds] = await db.query('SELECT * FROM refunds WHERE order_id = ? ORDER BY created_at DESC LIMIT 1', [order.id]);
      order.refund = refunds.length > 0 ? refunds[0] : null;

      // Fetch latest payment info
      const [payments] = await db.query(
        'SELECT id, transaction_reference, payment_method, amount, currency, status, failure_reason, paid_at, refund_reference, refund_amount, refund_status, refunded_at, created_at FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
        [order.id]
      );
      order.payment = payments.length > 0 ? payments[0] : null;
      
      res.status(200).json({ success: true, data: { order } });
    } catch (error) {
      console.error('Get order detail error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to fetch order details' } });
    }
  },

  getOrderTracking: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { orderNumber } = req.params;
      
      const trackingData = await orderService.getOrderTracking(orderNumber, userId);
      
      res.status(200).json({ success: true, data: trackingData });
    } catch (error) {
      console.error('Get order tracking error:', error);
      if (error.message === 'Order not found or unauthorized') {
        return res.status(404).json({ success: false, error: { message: error.message } });
      }
      res.status(500).json({ success: false, error: { message: 'Failed to fetch tracking details' } });
    }
  },

  cancelOrder: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { orderNumber } = req.params;
      const { reason } = req.body;

      const [orders] = await db.query('SELECT id FROM orders WHERE order_number = ?', [orderNumber]);
      if (orders.length === 0) return res.status(404).json({ success: false, error: { message: 'Order not found' } });
      const orderId = orders[0].id;
      
      await cancellationService.cancelOrderDirectly(orderId, userId, reason || 'Ordered by mistake');
      
      res.status(200).json({ success: true, data: { status: 'cancelled' } });
    } catch (error) {
      console.error('Cancel order error:', error);
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  },

  requestCancellation: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { orderNumber } = req.params;
      const { reason, message } = req.body;

      const [orders] = await db.query('SELECT id FROM orders WHERE order_number = ?', [orderNumber]);
      if (orders.length === 0) return res.status(404).json({ success: false, error: { message: 'Order not found' } });
      const orderId = orders[0].id;
      
      await cancellationService.requestCancellation(orderId, userId, reason || 'Ordered by mistake', message);
      
      res.status(200).json({ success: true, data: { status: 'cancellation_pending' } });
    } catch (error) {
      console.error('Request cancellation error:', error);
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  },

  buyAgain: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { orderNumber } = req.params;
      
      const result = await orderService.processBuyAgain(orderNumber, userId);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Buy Again error:', error);
      if (error.statusCode === 404 || error.message === 'Order not found or unauthorized') {
        return res.status(404).json({ success: false, error: { message: 'Order not found or unauthorized' } });
      }
      return res.status(500).json({ success: false, error: { message: 'Failed to process Buy Again request' } });
    }
  },

  reorder: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { orderNumber } = req.params;
      
      const result = await orderService.processBuyAgain(orderNumber, userId);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Reorder error:', error);
      if (error.statusCode === 404 || error.message === 'Order not found or unauthorized') {
        return res.status(404).json({ success: false, error: { message: 'Order not found or unauthorized' } });
      }
      return res.status(500).json({ success: false, error: { message: 'Failed to prepare reorder' } });
    }
  }
};

module.exports = orderController;
