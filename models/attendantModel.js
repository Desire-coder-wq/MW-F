const mongoose = require("mongoose");

const attendantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel", // link to the main user
    required: true
  },
  
  // Task-related fields
  assignedTask: { type: String, default: "Unassigned" },
  lastTaskUpdate: { type: Date, default: null }, // track last task update

  // Status
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  lastActive: { type: Date, default: Date.now } // updated when status changes or login
}, { timestamps: true }); // adds createdAt & updatedAt automatically

module.exports = mongoose.model("Attendant", attendantSchema);
