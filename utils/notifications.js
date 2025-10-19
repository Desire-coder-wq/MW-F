const mongoose = require('mongoose');
const Notification = require('../models/Notifications');
const Manager = require('../models/managerModel');

class NotificationManager {
  // Utility to safely convert IDs
  static toObjectId(id) {
    if (!id) return null;
    if (id instanceof mongoose.Types.ObjectId) return id;
    try {
      return new mongoose.Types.ObjectId(id.toString());
    } catch (err) {
      console.warn("Invalid ObjectId:", id);
      return null;
    }
  }

  // Get notifications for manager
  static async getManagerNotifications(managerId, limit = 10) {
    try {
      const managerObjectId = this.toObjectId(managerId);
      if (!managerObjectId) {
        console.error('Invalid managerId provided to getManagerNotifications');
        return [];
      }

      console.log('Querying notifications for manager:', managerObjectId);

      const notifications = await Notification.find({
        $or: [
          { recipients: managerObjectId },
          { recipients: { $exists: true, $size: 0 } },
          { recipients: { $exists: false } }
        ]
      })
        .populate('initiatedBy', 'name email')
        .populate('relatedId')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      console.log('Found notifications:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('Error fetching manager notifications:', error);
      return [];
    }
  }

  // Get unread count
  static async getUnreadCount(userId) {
    try {
      const userObjectId = this.toObjectId(userId);
      if (!userObjectId) {
        console.error('Invalid userId provided to getUnreadCount');
        return 0;
      }

      const count = await Notification.countDocuments({
        $or: [
          { recipients: userObjectId },
          { recipients: { $exists: true, $size: 0 } },
          { recipients: { $exists: false } }
        ],
        status: 'unread'
      });

      console.log('Unread count for user', userObjectId, ':', count);
      return count;
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
  }

  // Mark a notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const userObjectId = this.toObjectId(userId);
      if (!userObjectId) {
        console.error('Invalid userId provided to markAsRead');
        return;
      }

      const result = await Notification.findOneAndUpdate(
        {
          _id: this.toObjectId(notificationId),
          $or: [
            { recipients: userObjectId },
            { recipients: { $exists: true, $size: 0 } },
            { recipients: { $exists: false } }
          ]
        },
        { $set: { status: 'read' } },
        { new: true }
      );

      if (result) {
        console.log('Notification marked as read:', notificationId);
      } else {
        console.warn('Notification not found or already read:', notificationId);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId) {
    try {
      const userObjectId = this.toObjectId(userId);
      if (!userObjectId) {
        console.error('Invalid userId provided to markAllAsRead');
        return;
      }

      const result = await Notification.updateMany(
        {
          $or: [
            { recipients: userObjectId },
            { recipients: { $exists: true, $size: 0 } },
            { recipients: { $exists: false } }
          ],
          status: 'unread'
        },
        { $set: { status: 'read' } }
      );

      console.log(`Marked ${result.modifiedCount} notifications as read for user:`, userObjectId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Notify managers when stock is added
  static async notifyStockAddition(submissionId, attendantId, attendantName, productName, quantity) {
    try {
      const managers = await Manager.find({}).select('_id name email');
      
      console.log('Found managers for stock notification:', managers.length);
      
      if (managers.length === 0) {
        console.warn('No managers found to notify about stock addition');
        return;
      }

      const recipientIds = managers.map(manager => manager._id);
      console.log('Manager IDs:', recipientIds);

      const notification = await Notification.create({
        type: "stock_approval",
        title: "Stock Requires Approval",
        message: `${attendantName} has added ${quantity} units of ${productName} that require your approval.`,
        priority: "high",
        relatedId: submissionId,
        onModel: "StockSubmission",
        initiatedBy: this.toObjectId(attendantId),
        userModel: "User",
        recipients: recipientIds,
        status: "unread",
        actionUrl: `/approve-stock`,
        actionRequired: true
      });

      console.log(` Notification created: ${notification._id} for ${recipientIds.length} managers`);
      return notification;
    } catch (error) {
      console.error(' Error creating stock approval notification:', error);
    }
  }

  // Notify attendant when stock is approved
  static async notifyStockApproval(submissionId, managerId, managerName, productName, quantity) {
    try {
      const StockSubmission = require('../models/stockSubmission');
      const submission = await StockSubmission.findById(submissionId).populate('submittedBy');
      
      if (!submission || !submission.submittedBy) {
        console.warn('Stock submission or submittedBy not found:', submissionId);
        return;
      }

      const notification = await Notification.create({
        type: "stock_approved",
        title: "Stock Approved",
        message: `Your stock submission of ${quantity} units of ${productName} has been approved by ${managerName}.`,
        priority: "medium",
        relatedId: submissionId,
        onModel: "StockSubmission",
        initiatedBy: this.toObjectId(managerId),
        userModel: "Manager",
        recipients: [submission.submittedBy._id],
        status: "unread",
        actionUrl: "/attendant-dashboard",
        actionRequired: false
      });

      console.log('Stock approval notification created for attendant:', submission.submittedBy._id);
      return notification;
    } catch (error) {
      console.error(' Error creating stock approved notification:', error);
    }
  }

  // Notify attendant when stock is rejected
  static async notifyStockRejection(submissionId, managerId, managerName, productName, quantity) {
    try {
      const StockSubmission = require('../models/stockSubmission');
      const submission = await StockSubmission.findById(submissionId).populate('submittedBy');
      
      if (!submission || !submission.submittedBy) {
        console.warn('Stock submission or submittedBy not found:', submissionId);
        return;
      }

      const notification = await Notification.create({
        type: "stock_rejected",
        title: "Stock Rejected",
        message: `Your stock submission of ${quantity} units of ${productName} has been rejected by ${managerName}.`,
        priority: "medium",
        relatedId: submissionId,
        onModel: "StockSubmission",
        initiatedBy: this.toObjectId(managerId),
        userModel: "Manager",
        recipients: [submission.submittedBy._id],
        status: "unread",
        actionUrl: "/attendant-dashboard",
        actionRequired: false
      });

      console.log('Stock rejection notification created for attendant:', submission.submittedBy._id);
      return notification;
    } catch (error) {
      console.error(' Error creating stock rejected notification:', error);
    }
  }

  // Notify managers when a task is completed
  static async notifyTaskCompletion(taskId, attendantId, attendantName, taskType, taskDescription) {
    try {
      const managers = await Manager.find({}).select('_id');
      
      if (managers.length === 0) {
        console.warn('No managers found to notify about task completion');
        return;
      }

      const recipientIds = managers.map(manager => manager._id);

      const notification = await Notification.create({
        type: "task_completed",
        title: "Task Completed",
        message: `${attendantName} has completed task: ${taskType} - ${taskDescription}.`,
        priority: "medium",
        relatedId: taskId,
        onModel: "Task",
        initiatedBy: this.toObjectId(attendantId),
        userModel: "User",
        recipients: recipientIds,
        status: "unread",
        actionUrl: `/task-reports`,
        actionRequired: false
      });

      console.log('Task completion notification created for managers');
      return notification;
    } catch (error) {
      console.error('Error creating task completion notification:', error);
    }
  }

  // Notify managers when a sale is made
  static async notifySaleMade(saleData) {
    try {
      const managers = await Manager.find({}).select('_id');
      
      if (managers.length === 0) {
        console.warn('No managers found to notify about sale');
        return;
      }

      const recipientIds = managers.map(manager => manager._id);

      const notification = await Notification.create({
        type: "sale_made",
        title: "New Sale Completed",
        message: `${saleData.attendantName} made a sale of ${saleData.amount} for ${saleData.customerName || 'a customer'}.`,
        priority: "medium",
        relatedId: saleData.saleId,
        onModel: "Sale",
        initiatedBy: this.toObjectId(saleData.attendantId),
        userModel: "User",
        recipients: recipientIds,
        status: "unread",
        actionUrl: `/sales/${saleData.saleId}`,
        actionRequired: false
      });

      console.log(' Sale notification created for managers');
      return notification;
    } catch (error) {
      console.error(' Error creating sale notification:', error);
    }
  }

  //  ADDED: Notify all managers when multiple items are low in stock
static async notifyLowStock(lowStockItems) {
  try {
    if (!Array.isArray(lowStockItems)) {
      console.warn("⚠️ Expected an array, received:", typeof lowStockItems);
      return;
    }

    if (lowStockItems.length === 0) return;

    const managers = await Manager.find({}).select('_id');
    if (managers.length === 0) {
      console.warn('No managers found to notify about low stock');
      return;
    }

    const recipientIds = managers.map(manager => manager._id);

    const notifications = lowStockItems.map(item => ({
      type: "low_stock",
      title: "Low Stock Alert",
      message: `The product "${item.productName}" is running low on stock (only ${item.quantity} left).`,
      priority: "high",
      relatedId: item._id,
      onModel: "Stock",
      initiatedBy: null,
      userModel: "System",
      recipients: recipientIds,
      status: "unread",
      actionUrl: "/stock",
      actionRequired: true
    }));

    await Notification.insertMany(notifications);
    console.log(` Created ${notifications.length} low stock notifications for managers.`);
  } catch (error) {
    console.error('Error creating low stock notifications:', error);
  }
}


  // Delete a notification
  static async deleteNotification(notificationId) {
    try {
      await Notification.findByIdAndDelete(this.toObjectId(notificationId));
      console.log('Notification deleted:', notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  // Clear all notifications for a user
  static async clearAllNotifications(userId) {
    try {
      const userObjectId = this.toObjectId(userId);
      if (!userObjectId) return;

      const result = await Notification.deleteMany({
        $or: [
          { recipients: userObjectId },
          { recipients: { $exists: true, $size: 0 } },
          { recipients: { $exists: false } }
        ]
      });

      console.log(`Cleared ${result.deletedCount} notifications for user:`, userObjectId);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }
}

module.exports = NotificationManager;
