// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['stock_approval', 'pending_sales', 'offload_request', 'low_stock', 'new_sale', 'task_completed', 'stock_approved', 'stock_rejected']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    enum: ['Stock', 'Sale', 'Task', 'User', 'StockSubmission']
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'action_required', 'completed'],
    default: 'unread'
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('Notification', notificationSchema);