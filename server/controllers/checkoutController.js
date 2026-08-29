const cartValidationService = require('../services/cartValidationService');
const deliveryService = require('../services/deliveryService');
const pricingService = require('../services/pricingService');
const orderService = require('../services/orderService');

const checkoutController = {
  /**
   * POST /api/cart/validate
   * Validates the client's cart and returns authoritative data and totals.
   */
  validateCart: async (req, res) => {
    try {
      const { items } = req.body;
      
      // Validate items against database
      const validationResult = await cartValidationService.validateCartItems(items);
      
      // Calculate authoritative subtotal
      const pricing = pricingService.calculateOrderTotals({
        items: validationResult.items,
        deliveryFee: 0, // Delivery not calculated at cart step
        discountAmount: 0
      });

      res.status(200).json({
        success: true,
        data: {
          items: validationResult.items,
          subtotal: pricing.subtotal,
          currency: pricing.currency,
          issues: validationResult.issues
        }
      });
    } catch (error) {
      console.error('Error validating cart:', error);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to validate cart' } });
    }
  },

  /**
   * POST /api/delivery/check
   * Checks if a postal code is serviceable and returns delivery rules.
   */
  checkDelivery: async (req, res) => {
    try {
      const { postalCode, subtotal } = req.body;
      
      const serviceability = await deliveryService.checkServiceability(postalCode);
      
      if (!serviceability.serviceable) {
        return res.status(200).json({
          success: true,
          data: serviceability
        });
      }

      // If a subtotal is provided, calculate the final delivery fee considering free delivery thresholds
      if (subtotal) {
        serviceability.finalDeliveryFee = deliveryService.calculateFinalDeliveryFee(serviceability, parseFloat(subtotal));
      }

      res.status(200).json({
        success: true,
        data: serviceability
      });
    } catch (error) {
      console.error('Error checking delivery:', error);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to check delivery' } });
    }
  },

  /**
   * POST /api/orders/prepare
   * Validates everything and creates a pending_payment order draft.
   */
  prepareOrder: async (req, res) => {
    try {
      const { customer, address, deliveryMethod, items } = req.body;

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

      // 1. Validate Cart
      const cartValidation = await cartValidationService.validateCartItems(items);
      if (cartValidation.issues.length > 0) {
        // If there are issues (like price change or stock out), reject the checkout
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
        // For gift orders, use recipient's postal code for delivery check
        const deliveryPostalCode = isGiftOrder ? giftData.giftRecipientPostalCode : (address && address.postalCode);
        if (!deliveryPostalCode) {
           return res.status(400).json({ success: false, error: { code: 'ADDRESS_INVALID', message: 'Postal code is required for delivery' }});
        }
        
        const serviceability = await deliveryService.checkServiceability(deliveryPostalCode);
        if (!serviceability.serviceable) {
           return res.status(400).json({ success: false, error: { code: 'DELIVERY_UNAVAILABLE', message: 'We do not deliver to this postal code.' }});
        }

        // We need a temporary subtotal to check free delivery threshold
        const tempSubtotal = validatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const calculatedFee = deliveryService.calculateFinalDeliveryFee(serviceability, tempSubtotal);
        
        if (calculatedFee === null) {
           return res.status(400).json({ success: false, error: { code: 'MINIMUM_ORDER_NOT_MET', message: `Minimum order amount is ₹${serviceability.minimumOrderAmount}` }});
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
        const db = require('../config/db'); // Ensure db is required for coupon lookup
        
        // Find the coupon
        const [coupons] = await db.query('SELECT * FROM coupons WHERE code = ?', [normalizedCode]);

        if (coupons.length > 0) {
          const coupon = coupons[0];
          let isValid = true;
          let errorMessage = '';

          // Validate Status & Dates
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

          // Validate Minimum Order
          const minOrder = parseFloat(coupon.minimum_order_amount) || 0;
          if (isValid && tempSubtotal < minOrder) {
            isValid = false;
            errorMessage = `Minimum order of ₹${minOrder} required for this coupon`;
          }

          // Validate Global Usage Limit
          if (isValid && coupon.usage_limit) {
            const [usageCount] = await db.query('SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ?', [coupon.id]);
            if (usageCount[0].count >= coupon.usage_limit) {
              isValid = false;
              errorMessage = 'This coupon has reached its usage limit';
            }
          }

          // Validate Per-User Limit
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
            return res.status(400).json({ success: false, error: { code: 'INVALID_COUPON', message: errorMessage }});
          }

          // Calculate Discount
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

          // Ensure discount doesn't exceed subtotal
          if (coupon.discount_type !== 'free_delivery' && finalDiscountAmount > tempSubtotal) {
            finalDiscountAmount = tempSubtotal;
          }

          appliedCouponId = coupon.id;
          appliedCouponCode = coupon.code;
        }
      }

      // 4. Calculate Final Pricing
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
          appliedGiftCard = await giftCardService.validateForCheckout(req.body.giftCardCode, req.user.sub);
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
      const orderData = {
        userId: req.user.sub, // Authenticated customer ID
        guestFirstName: customer.firstName,
        guestLastName: customer.lastName,
        guestEmail: customer.email,
        guestPhone: customer.phone,
        deliveryMethod,
        deliveryAddress: address,
        notes: req.body.notes || null,
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

      // 6. Create Order Draft in DB using Transaction
      const orderDraft = await orderService.createOrderDraft(orderData, validatedItems);

      res.status(200).json({
        success: true,
        data: {
          ...orderDraft,
          giftCardAmount: giftCardDeduction,
          payableTotal: finalPayableTotal,
          isFullyPaidByGiftCard: finalPayableTotal === 0 && giftCardDeduction > 0
        }
      });

    } catch (error) {
      console.error('Error preparing order:', error);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to prepare order' } });
    }
  }
};

module.exports = checkoutController;
