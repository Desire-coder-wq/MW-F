const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  item: {
    type: String,
    enum: ["Poles", "Softwood", "Hardwood", "Timber"],
    required: true
  },
  quantity: { type: Number, required: true },
  cost: { type: Number, required: true }, // expense per stock entry
  attendant: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Stock", stockSchema);
