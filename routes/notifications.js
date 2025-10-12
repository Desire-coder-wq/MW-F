const express = require('express');
const router = express.Router();
const NotificationManager = require('../utils/notifications');
const { ensureauthenticated, ensureManager } = require('../middleware/auth');

// Get notifications for manager dashboard (API)
router.get('/notifications', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const notifications = await NotificationManager.getManagerNotifications(20);
    const unreadCount = await NotificationManager.getUnreadCount();
    
    res.json({
      success: true,
      notifications: notifications,
      unreadCount: unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Render notifications page
router.get('/notifications-page', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const notifications = await NotificationManager.getManagerNotifications(50);
    const unreadCount = await NotificationManager.getUnreadCount();
    
    res.render('notifications', {
      user: req.session.user,
      title: 'Notifications',
      notifications: notifications,
      unreadCount: unreadCount
    });
  } catch (error) {
    console.error('Error loading notifications page:', error);
    res.status(500).render('error', { 
      error: 'Failed to load notifications page',
      message: 'Please try again later.'
    });
  }
});

// Mark notification as read
router.post('/notifications/:id/read', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    await NotificationManager.markAsRead(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all notifications as read
router.post('/notifications/mark-all-read', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    await NotificationManager.markAllAsRead();
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;