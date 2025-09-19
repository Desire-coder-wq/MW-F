const mongoose = require("mongoose");

const attendantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  // Task-related fields
  assignedTask: { type: String, default: "Unassigned" },
  lastTaskUpdate: { type: Date, default: null }, // ✅ track when task was last updated

  // Status
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  lastActive: { type: Date, default: Date.now } // ✅ updated when status changes or login
}, { timestamps: true }); // ✅ adds createdAt & updatedAt automatically

module.exports = mongoose.model("Attendant", attendantSchema);
