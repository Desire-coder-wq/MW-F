const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "stock_approval",
        "stock_approved",
        "stock_rejected",
        "task_completed",
        "sale_made",
        "low_stock"
      ],
    },
    
    title: { type: String, required: true },
    message: { type: String, required: true },
    
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
      index: true,
    },
    
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    
    // The user who triggered the notification (manager, attendant, or null for system)
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "userModel",
      default: null, // Null for system-generated notifications
    },
    
    userModel: {
      type: String,
      enum: ["User", "Manager"], // REMOVED "System" - it doesn't exist as a model
      default: "User",
    },
    
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "onModel",
    },
    
    onModel: {
      type: String,
      enum: ["StockSubmission", "Stock", "Task", "Sale"],
      default: "Stock",
    },
    
    actionUrl: { type: String },
    actionRequired: { type: Boolean, default: false },
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields
  }
);

// Optional indexes for performance
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ recipients: 1, status: 1 });

module.exports = mongoose.model("Notification", notificationSchema);