const express = require('express');
const router = express.Router();
const NotificationManager = require('../utils/notifications'); // Utility for notification logic
const { ensureauthenticated, ensureManager } = require('../middleware/auth');

// GET notifications (for AJAX/API calls)
router.get('/notifications', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const managerId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await NotificationManager.getManagerNotifications(managerId, limit);
    const unreadCount = await NotificationManager.getUnreadCount(managerId);

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// Render notifications page
router.get('/notifications-page', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const managerId = req.user._id;

    const notifications = await NotificationManager.getManagerNotifications(managerId, 50);
    const unreadCount = await NotificationManager.getUnreadCount(managerId);

    res.render('notifications', {
      title: 'Notifications',
      user: req.user,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error rendering notifications page:', error);
    res.render('notifications', {
      title: 'Notifications',
      user: req.user,
      notifications: [],
      unreadCount: 0
    });
  }
});

// Mark a single notification as read
router.post('/notifications/:id/read', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const managerId = req.user._id;
    await NotificationManager.markAsRead(req.params.id, managerId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.post('/notifications/mark-all-read', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const managerId = req.user._id;
    await NotificationManager.markAllAsRead(managerId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
});

// Paginated notifications
router.get('/notifications/paginated', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const managerId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await NotificationManager.getNotificationsPaginated(managerId, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error fetching paginated notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch paginated notifications' });
  }
});

// Delete a single notification
router.delete('/notifications/:id', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    await NotificationManager.deleteNotification(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

// Clear all notifications for a manager
router.delete('/notifications', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const managerId = req.user._id;
    await NotificationManager.clearAllNotifications(managerId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to clear notifications' });
  }
});

module.exports = router;
