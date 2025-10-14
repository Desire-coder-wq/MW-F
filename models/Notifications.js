const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
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
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    enum: ['StockSubmission', 'User', 'OtherModel']
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userModel: {
    type: String,
    default: 'User'
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['unread', 'read', 'dismissed'],
    default: 'unread'
  },
  actionUrl: String,
  actionRequired: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better performance
notificationSchema.index({ recipients: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);