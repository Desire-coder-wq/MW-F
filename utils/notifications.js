const Notification = require('../models/Notification');
const User = require('../models/userModel');
class NotificationManager {
  // Create a new notification
  static async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();
      
      // Emit real-time notification (if using Socket.io)
      if (global.io) {
        global.io.emit('new_notification', notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Notify manager when attendant adds stock
  static async notifyStockAddition(stockId, attendantId, attendantName, productName, quantity) {
    return await this.createNotification({
      type: 'stock_approval',
      title: 'Stock Requires Approval',
      message: `${attendantName} has added ${quantity} units of ${productName} that requires your approval`,
      priority: 'high',
      relatedId: stockId,
      onModel: 'StockSubmission',
      initiatedBy: attendantId,
      actionRequired: true,
      actionUrl: `/approve-stock`
    });
  }

  // Notify manager when stock is approved
  static async notifyStockApproval(stockId, managerId, managerName, productName, quantity) {
    return await this.createNotification({
      type: 'stock_approved',
      title: 'Stock Approved',
      message: `${managerName} approved ${quantity} units of ${productName}`,
      priority: 'medium',
      relatedId: stockId,
      onModel: 'Stock',
      initiatedBy: managerId,
      actionUrl: `/stockList`
    });
  }

  // Notify manager when stock is rejected
  static async notifyStockRejection(stockId, managerId, managerName, productName, quantity) {
    return await this.createNotification({
      type: 'stock_rejected',
      title: 'Stock Rejected',
      message: `${managerName} rejected ${quantity} units of ${productName}`,
      priority: 'medium',
      relatedId: stockId,
      onModel: 'StockSubmission',
      initiatedBy: managerId,
      actionUrl: `/approve-stock`
    });
  }

  // Notify manager about pending sales
  static async notifyPendingSales(saleId, attendantId, attendantName, customerName, amount) {
    return await this.createNotification({
      type: 'pending_sales',
      title: 'Sale Requires Loading',
      message: `${attendantName} made a sale of $${amount} to ${customerName} that requires loading`,
      priority: 'high',
      relatedId: saleId,
      onModel: 'Sale',
      initiatedBy: attendantId,
      actionRequired: true,
      actionUrl: `/loading/pending`
    });
  }

  // Notify manager about large sales
  static async notifyLargeSale(saleId, attendantId, attendantName, amount, customerName) {
    return await this.createNotification({
      type: 'new_sale',
      title: 'Large Sale Completed',
      message: `${attendantName} completed a large sale of $${amount} to ${customerName}`,
      priority: 'medium',
      relatedId: saleId,
      onModel: 'Sale',
      initiatedBy: attendantId,
      actionUrl: `/sales-list`
    });
  }

  // Notify manager about stock that needs offloading
  static async notifyOffloadRequest(stockId, attendantId, attendantName, productName, quantity) {
    return await this.createNotification({
      type: 'offload_request',
      title: 'Stock Arrived - Needs Offloading',
      message: `${attendantName} is offloading ${quantity} units of ${productName}`,
      priority: 'urgent',
      relatedId: stockId,
      onModel: 'Stock',
      initiatedBy: attendantId,
      actionRequired: true,
      actionUrl: `/loading/report`
    });
  }

  // Notify manager when task is completed
  static async notifyTaskCompletion(taskId, attendantId, attendantName, taskType, taskDescription) {
    return await this.createNotification({
      type: 'task_completed',
      title: 'Task Completed',
      message: `${attendantName} completed task: ${taskType} - ${taskDescription}`,
      priority: 'medium',
      relatedId: taskId,
      onModel: 'Task',
      initiatedBy: attendantId,
      actionUrl: `/task-reports`
    });
  }

  // Get notifications for manager
  static async getManagerNotifications(limit = 10) {
    return await Notification.find({})
      .populate('initiatedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  // Get unread notification count
  static async getUnreadCount() {
    return await Notification.countDocuments({ status: 'unread' });
  }

  // Mark notification as read
  static async markAsRead(notificationId) {
    return await Notification.findByIdAndUpdate(
      notificationId,
      { status: 'read' },
      { new: true }
    );
  }

  // Mark all notifications as read
  static async markAllAsRead() {
    return await Notification.updateMany(
      { status: 'unread' },
      { status: 'read' }
    );
  }
}

module.exports = NotificationManager;