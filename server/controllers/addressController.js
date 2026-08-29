const db = require('../config/db');

const addressController = {
  getAddresses: async (req, res) => {
    try {
      const userId = req.user.sub;
      const [addresses] = await db.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [userId]);
      
      res.status(200).json({ success: true, data: { addresses } });
    } catch (error) {
      console.error('Get addresses error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to fetch addresses' } });
    }
  },
  
  addAddress: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { label, fullName, phone, addressLine1, addressLine2, landmark, city, state, postalCode, country, isDefault } = req.body;
      
      if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
        return res.status(400).json({ success: false, error: { message: 'Missing required address fields' } });
      }

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        
        if (isDefault) {
          await connection.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
        }
        
        const [result] = await connection.query(
          `INSERT INTO addresses (user_id, label, full_name, phone, address_line_1, address_line_2, landmark, city, state, postal_code, country, is_default)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, label, fullName, phone, addressLine1, addressLine2 || null, landmark || null, city, state, postalCode, country || 'India', isDefault || false]
        );
        
        await connection.commit();
        
        res.status(201).json({ success: true, data: { addressId: result.insertId } });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Add address error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to add address' } });
    }
  },

  updateAddress: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { id } = req.params;
      const { label, fullName, phone, addressLine1, addressLine2, landmark, city, state, postalCode, country, isDefault } = req.body;
      
      if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
        return res.status(400).json({ success: false, error: { message: 'Missing required address fields' } });
      }

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        
        // Check ownership
        const [existing] = await connection.query('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
        if (existing.length === 0) {
          await connection.rollback();
          return res.status(404).json({ success: false, error: { message: 'Address not found or not authorized' } });
        }

        if (isDefault) {
          await connection.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
        }
        
        await connection.query(
          `UPDATE addresses SET label = ?, full_name = ?, phone = ?, address_line_1 = ?, address_line_2 = ?, landmark = ?, city = ?, state = ?, postal_code = ?, country = ?, is_default = ? WHERE id = ? AND user_id = ?`,
          [label, fullName, phone, addressLine1, addressLine2 || null, landmark || null, city, state, postalCode, country || 'India', isDefault || false, id, userId]
        );
        
        await connection.commit();
        res.status(200).json({ success: true, message: 'Address updated successfully' });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Update address error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to update address' } });
    }
  },

  deleteAddress: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { id } = req.params;
      
      const [result] = await db.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: { message: 'Address not found or not authorized' } });
      }
      
      res.status(200).json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
      console.error('Delete address error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to delete address' } });
    }
  }
};

module.exports = addressController;
