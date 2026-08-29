const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All notification routes require authentication

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.post('/mark-all-read', notificationController.markAllAsRead);
router.post('/:id/read', notificationController.markAsRead);

module.exports = router;
