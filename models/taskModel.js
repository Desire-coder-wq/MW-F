const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  attendantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Attendant",
    required: true
  },
  attendantName: {
    type: String,
    required: true
  },
  attendantEmail: {
    type: String,
    required: true
  },
  taskType: {
    type: String,
    required: true,
    enum: ["stock_management", "sales_processing", "customer_service", "loading_supervision", "offloading_supervision", "inventory_check", "report_generation"]
  },
  taskDescription: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    required: true,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "in progress", "completed"],
    default: "pending"
  },
  assignedBy: {
    type: String,
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);