const Notification = require('../models/Notifications');
const User = require('../models/userModel');

class NotificationManager {
  // Get notifications for manager
  static async getManagerNotifications(managerId, limit = 10) {
    try {
      const notifications = await Notification.find({
        $or: [
          { recipients: managerId },
          { recipients: { $size: 0 } }
        ]
      })
      .populate('initiatedBy', 'name email')
      .populate('relatedId')
      .sort({ createdAt: -1 })
      .limit(limit);

      return notifications;
    } catch (error) {
      console.error('Error fetching manager notifications:', error);
      return [];
    }
  }

  // Get unread count
  static async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        $or: [
          { recipients: userId },
          { recipients: { $size: 0 } }
        ],
        status: 'unread'
      });
      return count;
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
  }

  // Mark as read
  static async markAsRead(notificationId, userId) {
    try {
      await Notification.findOneAndUpdate(
        { 
          _id: notificationId,
          $or: [
            { recipients: userId },
            { recipients: { $size: 0 } }
          ]
        },
        { $set: { status: 'read' } }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all as read
  static async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { 
          $or: [
            { recipients: userId },
            { recipients: { $size: 0 } }
          ],
          status: 'unread'
        },
        { $set: { status: 'read' } }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // NOTIFICATION TRIGGERS 

  // 1. When attendant adds stock - notify manager for approval
  static async notifyStockAdded(stockData) {
    try {
      // Find all managers
      const managers = await User.find({ 
        role: 'manager',
        isActive: true
      }).select('_id');

      if (managers.length === 0) {
        console.log('No managers found to notify');
        return;
      }

      const recipientIds = managers.map(manager => manager._id);

      const notification = await Notification.create({
        type: "stock_approval",
        title: "Stock Requires Approval",
        message: `${stockData.requesterName} has added ${stockData.quantity} units of ${stockData.materialType} that requires your approval`,
        priority: "high",
        relatedId: stockData.submissionId,
        onModel: "StockSubmission",
        initiatedBy: stockData.requesterId,
        userModel: "User",
        recipients: recipientIds,
        status: "unread",
        actionUrl: `/approve-stock/${stockData.submissionId}`,
        actionRequired: true
      });

      console.log(`Stock approval notification sent to ${recipientIds.length} managers`);
      return notification;
    } catch (error) {
      console.error('Error creating stock approval notification:', error);
      throw error;
    }
  }

  // 2. When a sale is made - notify manager
  static async notifySaleMade(saleData) {
    try {
      const managers = await User.find({ 
        role: 'manager',
        isActive: true
      }).select('_id');

      if (managers.length === 0) return;

      const recipientIds = managers.map(manager => manager._id);

      const notification = await Notification.create({
        type: "sale_made",
        title: "New Sale Completed",
        message: `${saleData.attendantName} made a sale of ${saleData.amount} for ${saleData.customerName || 'a customer'}`,
        priority: "medium",
        relatedId: saleData.saleId,
        onModel: "Sale",
        initiatedBy: saleData.attendantId,
        userModel: "User",
        recipients: recipientIds,
        status: "unread",
        actionUrl: `/sales/${saleData.saleId}`,
        actionRequired: false
      });

      console.log(`Sale notification sent to ${recipientIds.length} managers`);
      return notification;
    } catch (error) {
      console.error('Error creating sale notification:', error);
      throw error;
    }
  }

  // 3. When stock is low - notify manager
  static async notifyLowStock(lowStockData) {
    try {
      const managers = await User.find({ 
        role: 'manager',
        isActive: true
      }).select('_id');

      if (managers.length === 0) return;

      const recipientIds = managers.map(manager => manager._id);

      const notification = await Notification.create({
        type: "low_stock",
        title: "Low Stock Alert",
        message: `Stock for ${lowStockData.materialName} is running low. Current quantity: ${lowStockData.currentQuantity}`,
        priority: "high",
        relatedId: lowStockData.materialId,
        onModel: "Stock",
        initiatedBy: lowStockData.materialId, // or system
        userModel: "System",
        recipients: recipientIds,
        status: "unread",
        actionUrl: "/stock",
        actionRequired: true
      });

      console.log(`Low stock notification sent for ${lowStockData.materialName}`);
      return notification;
    } catch (error) {
      console.error('Error creating low stock notification:', error);
      throw error;
    }
  }

  // 4. When stock is approved/rejected - notify attendant
  static async notifyStockApproval(approvalData) {
    try {
      const notification = await Notification.create({
        type: "stock_approved",
        title: `Stock ${approvalData.status}`,
        message: `Your stock submission of ${approvalData.quantity} units of ${approvalData.materialType} has been ${approvalData.status}`,
        priority: "medium",
        relatedId: approvalData.submissionId,
        onModel: "StockSubmission",
        initiatedBy: approvalData.approverId,
        userModel: "User",
        recipients: [approvalData.requesterId], // Notify the attendant who requested
        status: "unread",
        actionUrl: "/attendant-dashboard",
        actionRequired: false
      });

      console.log(`Stock ${approvalData.status} notification sent to attendant`);
      return notification;
    } catch (error) {
      console.error('Error creating stock approval status notification:', error);
      throw error;
    }
  }

  

  // For attendant stock addition - notify manager for approval
  static async notifyStockAddition(submissionId, attendantId, attendantName, productName, quantity) {
    try {
      // Find all managers
      const managers = await User.find({ 
        role: 'manager',
        isActive: true
      }).select('_id');

      if (managers.length === 0) {
        console.log('No managers found to notify');
        return;
      }

      const recipientIds = managers.map(manager => manager._id);

      const notification = await Notification.create({
        type: "stock_approval",
        title: "Stock Requires Approval",
        message: `${attendantName} has added ${quantity} units of ${productName} that requires your approval`,
        priority: "high",
        relatedId: submissionId,
        onModel: "StockSubmission",
        initiatedBy: attendantId,
        userModel: "User",
        recipients: recipientIds,
        status: "unread",
        actionUrl: `/approve-stock`,
        actionRequired: true
      });

      console.log(`Stock approval notification sent to ${recipientIds.length} managers`);
      return notification;
    } catch (error) {
      console.error('Error creating stock approval notification:', error);
      throw error;
    }
  }

  // For stock approval - notify attendant
  static async notifyStockApproval(submissionId, managerId, managerName, productName, quantity) {
    try {
      // First get the submission to find who submitted it
      const StockSubmission = require('../models/stockSubmission');
      const submission = await StockSubmission.findById(submissionId).populate('submittedBy');
      
      if (!submission || !submission.submittedBy) {
        console.log('Submission or submitter not found');
        return;
      }

      const notification = await Notification.create({
        type: "stock_approved",
        title: "Stock Approved",
        message: `Your stock submission of ${quantity} units of ${productName} has been approved by ${managerName}`,
        priority: "medium",
        relatedId: submissionId,
        onModel: "StockSubmission",
        initiatedBy: managerId,
        userModel: "User",
        recipients: [submission.submittedBy._id], // Notify the attendant who submitted
        status: "unread",
        actionUrl: "/attendant-dashboard",
        actionRequired: false
      });

      console.log(`Stock approval notification sent to attendant`);
      return notification;
    } catch (error) {
      console.error('Error creating stock approved notification:', error);
      throw error;
    }
  }

  // For stock rejection - notify attendant
  static async notifyStockRejection(submissionId, managerId, managerName, productName, quantity) {
    try {
      // First get the submission to find who submitted it
      const StockSubmission = require('../models/stockSubmission');
      const submission = await StockSubmission.findById(submissionId).populate('submittedBy');
      
      if (!submission || !submission.submittedBy) {
        console.log('Submission or submitter not found');
        return;
      }

      const notification = await Notification.create({
        type: "stock_rejected",
        title: "Stock Rejected",
        message: `Your stock submission of ${quantity} units of ${productName} has been rejected by ${managerName}`,
        priority: "medium",
        relatedId: submissionId,
        onModel: "StockSubmission",
        initiatedBy: managerId,
        userModel: "User",
        recipients: [submission.submittedBy._id], // Notify the attendant who submitted
        status: "unread",
        actionUrl: "/attendant-dashboard",
        actionRequired: false
      });

      console.log(`Stock rejection notification sent to attendant`);
      return notification;
    } catch (error) {
      console.error('Error creating stock rejected notification:', error);
      throw error;
    }
  }

  // For task completion - notify manager
  static async notifyTaskCompletion(taskId, attendantId, attendantName, taskType, taskDescription) {
    try {
      const managers = await User.find({ 
        role: 'manager',
        isActive: true
      }).select('_id');

      if (managers.length === 0) return;

      const recipientIds = managers.map(manager => manager._id);

      const notification = await Notification.create({
        type: "task_completed",
        title: "Task Completed",
        message: `${attendantName} has completed task: ${taskType} - ${taskDescription}`,
        priority: "medium",
        relatedId: taskId,
        onModel: "Task",
        initiatedBy: attendantId,
        userModel: "User",
        recipients: recipientIds,
        status: "unread",
        actionUrl: `/task-reports`,
        actionRequired: false
      });

      console.log(`Task completion notification sent to managers`);
      return notification;
    } catch (error) {
      console.error('Error creating task completion notification:', error);
      throw error;
    }
  }

  // Additional method for low stock (if needed)
  static async notifyLowStockAlert(materialName, currentQuantity, materialId) {
    try {
      const managers = await User.find({ 
        role: 'manager',
        isActive: true
      }).select('_id');

      if (managers.length === 0) return;

      const recipientIds = managers.map(manager => manager._id);

      const notification = await Notification.create({
        type: "low_stock",
        title: "Low Stock Alert",
        message: `Stock for ${materialName} is running low. Current quantity: ${currentQuantity}`,
        priority: "high",
        relatedId: materialId,
        onModel: "Stock",
        initiatedBy: materialId,
        userModel: "System",
        recipients: recipientIds,
        status: "unread",
        actionUrl: "/stock",
        actionRequired: true
      });

      console.log(`Low stock notification sent for ${materialName}`);
      return notification;
    } catch (error) {
      console.error('Error creating low stock notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationManager;