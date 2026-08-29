const db = require('../config/db');

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(userId, orderId, type, title, message, metadata = null) {
    if (!userId) return;
    try {
      // Inject orderId into metadata if present
      const enhancedMetadata = metadata ? { ...metadata } : {};
      if (orderId && !enhancedMetadata.orderId) {
        enhancedMetadata.orderId = orderId;
      }

      // Duplicate prevention for order events
      if (orderId) {
        const [existing] = await db.query(
          `SELECT id FROM notifications 
           WHERE user_id = ? AND type = ? 
           AND JSON_EXTRACT(metadata, '$.orderId') = ?`,
          [userId, type, orderId]
        );
        if (existing.length > 0) return existing[0]; // Already exists, return silently
      }

      const [result] = await db.query(
        `INSERT INTO notifications (user_id, type, title, message, metadata)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, type, title, message, Object.keys(enhancedMetadata).length ? JSON.stringify(enhancedMetadata) : null]
      );
      
      return {
        id: result.insertId,
        userId,
        type,
        title,
        message,
        metadata,
        isRead: false,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user with pagination
   */
  async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const [rows] = await db.query(
        `SELECT id, type, title, message, metadata, read_at, created_at
         FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      
      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM notifications WHERE user_id = ?`,
        [userId]
      );
      
      const total = countResult[0].total;
      
      return {
        notifications: rows.map(row => ({
          id: row.id,
          type: row.type,
          title: row.title,
          message: row.message,
          metadata: row.metadata,
          isRead: row.read_at !== null,
          createdAt: row.created_at,
          readAt: row.read_at
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId) {
    try {
      const [result] = await db.query(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL`,
        [userId]
      );
      return result[0].count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read (validating ownership)
   */
  async markAsRead(notificationId, userId) {
    try {
      const [result] = await db.query(
        `UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?`,
        [notificationId, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      const [result] = await db.query(
        `UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL`,
        [userId]
      );
      return result.affectedRows;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Notify all active admins
   */
  async notifyAdmins(type, title, message, metadata = null) {
    try {
      const [admins] = await db.query(
        `SELECT id FROM users WHERE role = 'admin' AND status = 'active'`
      );
      
      for (const admin of admins) {
        await this.createNotification(admin.id, null, type, title, message, metadata);
      }
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  }

  /**
   * Notify all active customers
   */
  async notifyAllCustomers(type, title, message, metadata = null) {
    try {
      // Find all active customers
      const [customers] = await db.query(
        `SELECT id FROM users WHERE role = 'customer' AND status = 'active'`
      );
      
      if (customers.length === 0) return;

      // Bulk insert for performance
      const values = customers.map(customer => [
        customer.id, 
        type, 
        title, 
        message, 
        metadata ? JSON.stringify(metadata) : null
      ]);

      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, metadata) VALUES ?`,
        [values]
      );
    } catch (error) {
      console.error('Error notifying all customers:', error);
    }
  }
}

module.exports = new NotificationService();
