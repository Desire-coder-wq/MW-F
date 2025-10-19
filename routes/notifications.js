const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const NotificationManager = require('../utils/notifications');
const { ensureauthenticated, ensureManager } = require('../middleware/auth');

// Render notifications page (MAIN PAGE)
router.get('/notifications', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    // Get user from either session or req.user
    const user = req.session.user || req.user;
    if (!user) {
      console.error('No user found in session or req.user');
      return res.redirect('/login');
    }

    console.log('=== Notifications Page ===');
    console.log('User ID:', user._id);
    console.log('User Role:', user.role);

    const managerId = mongoose.Types.ObjectId.isValid(user._id) 
      ? new mongoose.Types.ObjectId(user._id) 
      : user._id;

    console.log('Fetching notifications for manager:', managerId);

    const notifications = await NotificationManager.getManagerNotifications(managerId, 50);
    const unreadCount = await NotificationManager.getUnreadCount(managerId);

    console.log('Notifications found:', notifications.length);
    console.log('Unread count:', unreadCount);

    res.render('notifications', {
      title: 'Notifications',
      user: user,
      notifications: notifications || [],
      unreadCount: unreadCount || 0
    });
  } catch (error) {
    console.error('Error rendering notifications page:', error);
    res.render('notifications', {
      title: 'Notifications',
      user: req.session.user || req.user,
      notifications: [],
      unreadCount: 0,
      error: 'Failed to load notifications'
    });
  }
});

// GET notifications (for AJAX/API calls)
router.get('/notifications/api', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const user = req.session.user || req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const managerId = mongoose.Types.ObjectId.isValid(user._id) 
      ? new mongoose.Types.ObjectId(user._id) 
      : user._id;
    
    const limit = parseInt(req.query.limit) || 20;

    console.log('API: Fetching notifications for manager:', managerId);

    const notifications = await NotificationManager.getManagerNotifications(managerId, limit);
    const unreadCount = await NotificationManager.getUnreadCount(managerId);

    console.log('API: Notifications found:', notifications.length);

    res.json({ 
      success: true, 
      notifications: notifications || [], 
      unreadCount: unreadCount || 0 
    });
  } catch (error) {
    console.error('API: Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
});

// Mark all notifications as read (MUST BE BEFORE /:id routes)
router.post('/notifications/mark-all-read', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const user = req.session.user || req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const managerId = mongoose.Types.ObjectId.isValid(user._id) 
      ? new mongoose.Types.ObjectId(user._id) 
      : user._id;

    console.log('Marking all notifications as read for manager:', managerId);
    
    await NotificationManager.markAllAsRead(managerId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read', error: error.message });
  }
});

// Mark a single notification as read
router.post('/notifications/:id/read', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const user = req.session.user || req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const managerId = mongoose.Types.ObjectId.isValid(user._id) 
      ? new mongoose.Types.ObjectId(user._id) 
      : user._id;

    console.log('Marking notification as read:', req.params.id, 'for manager:', managerId);
    
    await NotificationManager.markAsRead(req.params.id, managerId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read', error: error.message });
  }
});

// Delete a single notification
router.delete('/notifications/:id', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    console.log('Deleting notification:', req.params.id);
    await NotificationManager.deleteNotification(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification', error: error.message });
  }
});

// Clear all notifications for a manager
router.delete('/notifications', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const user = req.session.user || req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const managerId = mongoose.Types.ObjectId.isValid(user._id) 
      ? new mongoose.Types.ObjectId(user._id) 
      : user._id;

    console.log('Clearing all notifications for manager:', managerId);
    
    await NotificationManager.clearAllNotifications(managerId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to clear notifications', error: error.message });
  }
});

module.exports = router;