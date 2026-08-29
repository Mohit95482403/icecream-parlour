const db = require('../config/db');

const couponController = {
  // Get active coupons for the homepage
  getActiveCoupons: async (req, res) => {
    try {
      // Find active coupons that are currently valid (dates)
      const query = `
        SELECT 
          code, discount_type, discount_value, 
          minimum_order_amount, starts_at, expires_at
        FROM coupons
        WHERE status = 'active'
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at DESC
        LIMIT 4
      `;
      
      const [coupons] = await db.query(query);

      return res.status(200).json({
        success: true,
        data: coupons
      });
    } catch (error) {
      console.error('getActiveCoupons error:', error);
      res.status(500).json({ success: false, message: 'Internal server error fetching active coupons' });
    }
  },

  // Apply a coupon to calculate discount
  applyCoupon: async (req, res) => {
    try {
      const { code, cartTotal } = req.body;
      const userId = req.user ? (req.user.sub || req.user.id) : null; // If user is logged in

      if (!code || !code.trim()) {
        return res.status(400).json({ success: false, message: 'Coupon code is required' });
      }

      const normalizedCode = code.trim().toUpperCase();

      // Find the coupon
      const [coupons] = await db.query(`
        SELECT * FROM coupons WHERE code = ?
      `, [normalizedCode]);

      if (coupons.length === 0) {
        return res.status(404).json({ success: false, message: 'Invalid coupon code' });
      }

      const coupon = coupons[0];

      // Validate Status
      if (coupon.status !== 'active') {
        return res.status(400).json({ success: false, message: 'This coupon is no longer available' });
      }

      // Validate Dates
      const now = new Date();
      if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        return res.status(400).json({ success: false, message: 'This coupon is not active yet' });
      }
      if (coupon.expires_at && new Date(coupon.expires_at) <= now) {
        return res.status(400).json({ success: false, message: 'This coupon has expired' });
      }

      // Validate Minimum Order
      const totalAmount = parseFloat(cartTotal) || 0;
      const minOrder = parseFloat(coupon.minimum_order_amount) || 0;
      if (totalAmount < minOrder) {
        return res.status(400).json({ 
          success: false, 
          message: `Add ₹${(minOrder - totalAmount).toFixed(2)} more to use this coupon` 
        });
      }

      // Validate Global Usage Limit
      if (coupon.usage_limit) {
        const [usageCount] = await db.query('SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ?', [coupon.id]);
        if (usageCount[0].count >= coupon.usage_limit) {
          return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit' });
        }
      }

      // Validate Per-User Limit
      if (coupon.per_user_limit) {
        if (!userId) {
          return res.status(401).json({ success: false, message: 'You must be logged in to use this coupon' });
        }
        const [userUsage] = await db.query('SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?', [coupon.id, userId]);
        if (userUsage[0].count >= coupon.per_user_limit) {
          return res.status(400).json({ success: false, message: 'You have already used this coupon' });
        }
      }

      // Calculate Discount
      let discountAmount = 0;
      const discountValue = parseFloat(coupon.discount_value);
      const maxDiscount = parseFloat(coupon.maximum_discount_amount);

      if (coupon.discount_type === 'percentage') {
        discountAmount = totalAmount * (discountValue / 100);
        if (maxDiscount > 0 && discountAmount > maxDiscount) {
          discountAmount = maxDiscount;
        }
      } else if (coupon.discount_type === 'fixed') {
        discountAmount = discountValue;
      } else if (coupon.discount_type === 'free_delivery') {
        // Free delivery usually means the delivery fee becomes 0, so discount amount is the delivery fee
        // For this API response, we'll indicate it's free delivery.
        discountAmount = 0; // The actual discount will be on delivery fee, not cart total
      }

      // Ensure discount doesn't exceed total (except for free delivery)
      if (coupon.discount_type !== 'free_delivery' && discountAmount > totalAmount) {
        discountAmount = totalAmount;
      }

      return res.status(200).json({
        success: true,
        data: {
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          discount_amount: parseFloat(discountAmount.toFixed(2))
        },
        message: 'Coupon applied successfully'
      });

    } catch (error) {
      console.error('applyCoupon error:', error);
      res.status(500).json({ success: false, message: 'Internal server error applying coupon' });
    }
  }
};

module.exports = couponController;
