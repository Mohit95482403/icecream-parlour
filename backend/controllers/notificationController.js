const notificationService = require('../services/notificationService');

const notificationController = {
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.sub;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const data = await notificationService.getUserNotifications(userId, page, limit);

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to fetch notifications' } });
    }
  },

  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.sub;
      const count = await notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to fetch unread count' } });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const userId = req.user.sub;
      const notificationId = req.params.id;

      const success = await notificationService.markAsRead(notificationId, userId);

      if (!success) {
        return res.status(404).json({ success: false, error: { message: 'Notification not found' } });
      }

      res.status(200).json({ success: true, data: { message: 'Marked as read' } });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to mark notification as read' } });
    }
  },

  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.sub;

      const count = await notificationService.markAllAsRead(userId);

      res.status(200).json({ success: true, data: { updated: count } });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to mark all as read' } });
    }
  }
};

module.exports = notificationController;
