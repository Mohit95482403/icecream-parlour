const db = require('../config/db');

const customerController = {
  updateProfile: async (req, res) => {
    try {
      // Identity comes from authenticated middleware
      const userId = req.user.sub;
      const { firstName, lastName, phone } = req.body;
      
      const updates = [];
      const params = [];
      
      if (firstName !== undefined) {
        updates.push('first_name = ?');
        params.push(firstName.trim());
      }
      
      if (lastName !== undefined) {
        updates.push('last_name = ?');
        params.push(lastName.trim());
      }
      
      if (phone !== undefined) {
        updates.push('phone = ?');
        params.push(phone.trim());
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ success: false, error: { message: 'No valid fields provided for update' }});
      }
      
      params.push(userId);
      
      await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
      
      const [updated] = await db.query('SELECT id, first_name, last_name, email, phone, role, status FROM users WHERE id = ?', [userId]);
      
      res.status(200).json({
        success: true,
        data: { customer: updated[0] }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to update profile' } });
    }
  }
};

module.exports = customerController;
