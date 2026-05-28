const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const { requireAuth, requireRoles } = require('../middleware/auth');
const { requireBodyFields } = require('../middleware/validate');

// Admin/Manager can create notifications for a user
router.post('/', requireAuth, requireRoles('ADMIN', 'MANAGER'), requireBodyFields(['message', 'user_id']), notificationController.createNotification);
router.get('/', requireAuth, requireRoles('ADMIN', 'MANAGER'), notificationController.getAllNotifications);

// Current user's notifications
router.get('/me', requireAuth, notificationController.getMyNotifications);
router.get('/me/unread-count', requireAuth, notificationController.getUnreadCount);
router.post('/:id/read', requireAuth, notificationController.markRead);
router.delete('/:id', requireAuth, notificationController.deleteNotification);

module.exports = router;

