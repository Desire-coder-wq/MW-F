const mongoose = require("mongoose");

const attendantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // links to the User model
    required: true
  },
  assignedTask: { type: String, default: "Unassigned" },
  lastTaskUpdate: { type: Date, default: null },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true }); // adds createdAt & updatedAt automatically

module.exports = mongoose.model("Attendant", attendantSchema);
