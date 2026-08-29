const db = require('../config/db');

const adminCouponController = {
  // Get all coupons with usage stats
  getCoupons: async (req, res) => {
    try {
      const query = `
        SELECT 
          c.id, c.code, c.discount_type, c.discount_value, 
          c.minimum_order_amount, c.maximum_discount_amount, 
          c.usage_limit, c.per_user_limit, 
          c.starts_at, c.expires_at, c.status, c.created_at,
          (SELECT COUNT(*) FROM coupon_usage cu WHERE cu.coupon_id = c.id) as usage_count
        FROM coupons c
        ORDER BY c.created_at DESC
      `;
      
      const [coupons] = await db.query(query);

      return res.status(200).json({
        success: true,
        data: coupons
      });
    } catch (error) {
      console.error('getCoupons error:', error);
      res.status(500).json({ success: false, message: 'Internal server error fetching coupons' });
    }
  },

  // Create a new coupon
  createCoupon: async (req, res) => {
    try {
      const { 
        code, discount_type, discount_value, 
        minimum_order_amount, maximum_discount_amount,
        usage_limit, per_user_limit, starts_at, expires_at, status = 'active'
      } = req.body;

      if (!code || code.trim() === '') {
        return res.status(400).json({ success: false, message: 'Coupon code is required' });
      }

      if (!['percentage', 'fixed', 'free_delivery'].includes(discount_type)) {
        return res.status(400).json({ success: false, message: 'Invalid discount type' });
      }
      
      if (discount_value < 0) {
        return res.status(400).json({ success: false, message: 'Discount value cannot be negative' });
      }

      if (discount_type === 'percentage' && discount_value > 100) {
        return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100' });
      }

      const normalizedCode = code.trim().toUpperCase();

      // Check if code already exists
      const [existing] = await db.query('SELECT id FROM coupons WHERE code = ?', [normalizedCode]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'A coupon with this code already exists' });
      }

      const [result] = await db.query(
        `INSERT INTO coupons (
          code, discount_type, discount_value, 
          minimum_order_amount, maximum_discount_amount, 
          usage_limit, per_user_limit, starts_at, expires_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          normalizedCode, discount_type, discount_value || 0,
          minimum_order_amount || 0, maximum_discount_amount || null,
          usage_limit || null, per_user_limit || null,
          starts_at || null, expires_at || null, status
        ]
      );

      if (status === 'active') {
        const notificationService = require('../services/notificationService');
        await notificationService.notifyAllCustomers(
          'coupon',
          'Special Offer',
          `You have a new coupon or special offer available. Use code: ${normalizedCode}`,
          { couponCode: normalizedCode }
        );
      }

      return res.status(201).json({
        success: true,
        data: {
          id: result.insertId,
          code: normalizedCode
        },
        message: 'Coupon created successfully'
      });
    } catch (error) {
      console.error('createCoupon error:', error);
      res.status(500).json({ success: false, message: 'Internal server error creating coupon' });
    }
  },

  // Update a coupon
  updateCoupon: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        code, discount_type, discount_value, 
        minimum_order_amount, maximum_discount_amount,
        usage_limit, per_user_limit, starts_at, expires_at, status
      } = req.body;

      // Check if coupon exists
      const [coupons] = await db.query('SELECT * FROM coupons WHERE id = ?', [id]);
      if (coupons.length === 0) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
      }

      const currentCoupon = coupons[0];
      
      let newCode = currentCoupon.code;
      
      if (code && code.trim() !== '') {
        newCode = code.trim().toUpperCase();
        
        if (newCode !== currentCoupon.code) {
          // Check if new code exists
          const [existing] = await db.query('SELECT id FROM coupons WHERE code = ? AND id != ?', [newCode, id]);
          if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'A coupon with this code already exists' });
          }
        }
      }

      const newType = discount_type && ['percentage', 'fixed', 'free_delivery'].includes(discount_type) ? discount_type : currentCoupon.discount_type;
      const newValue = discount_value !== undefined ? discount_value : currentCoupon.discount_value;
      const newMinOrder = minimum_order_amount !== undefined ? minimum_order_amount : currentCoupon.minimum_order_amount;
      const newMaxDiscount = maximum_discount_amount !== undefined ? maximum_discount_amount : currentCoupon.maximum_discount_amount;
      const newUsageLimit = usage_limit !== undefined ? usage_limit : currentCoupon.usage_limit;
      const newPerUserLimit = per_user_limit !== undefined ? per_user_limit : currentCoupon.per_user_limit;
      const newStartsAt = starts_at !== undefined ? starts_at : currentCoupon.starts_at;
      const newExpiresAt = expires_at !== undefined ? expires_at : currentCoupon.expires_at;
      const newStatus = status && ['active', 'inactive', 'expired'].includes(status) ? status : currentCoupon.status;

      await db.query(
        `UPDATE coupons SET 
          code = ?, discount_type = ?, discount_value = ?, 
          minimum_order_amount = ?, maximum_discount_amount = ?, 
          usage_limit = ?, per_user_limit = ?, 
          starts_at = ?, expires_at = ?, status = ?
        WHERE id = ?`,
        [
          newCode, newType, newValue, 
          newMinOrder, newMaxDiscount, 
          newUsageLimit, newPerUserLimit, 
          newStartsAt, newExpiresAt, newStatus, 
          id
        ]
      );

      return res.status(200).json({
        success: true,
        message: 'Coupon updated successfully'
      });
    } catch (error) {
      console.error('updateCoupon error:', error);
      res.status(500).json({ success: false, message: 'Internal server error updating coupon' });
    }
  },

  // Update coupon status only (Activate / Deactivate)
  updateCouponStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'expired'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }

      // Check if coupon exists
      const [coupons] = await db.query('SELECT * FROM coupons WHERE id = ?', [id]);
      if (coupons.length === 0) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
      }

      await db.query('UPDATE coupons SET status = ? WHERE id = ?', [status, id]);

      return res.status(200).json({
        success: true,
        message: `Coupon status changed to ${status} successfully`
      });
    } catch (error) {
      console.error('updateCouponStatus error:', error);
      res.status(500).json({ success: false, message: 'Internal server error updating coupon status' });
    }
  },
  
  // Delete coupon
  deleteCoupon: async (req, res) => {
    try {
      const { id } = req.params;

      const [coupons] = await db.query('SELECT id FROM coupons WHERE id = ?', [id]);
      if (coupons.length === 0) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
      }

      await db.query('DELETE FROM coupons WHERE id = ?', [id]);

      return res.status(200).json({
        success: true,
        message: 'Coupon deleted successfully'
      });
    } catch (error) {
      console.error('deleteCoupon error:', error);
      res.status(500).json({ success: false, message: 'Internal server error deleting coupon' });
    }
  }
};

module.exports = adminCouponController;
