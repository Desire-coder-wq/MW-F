const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String },
  contact: { type: String },
  address: { type: String },
  dateAdded: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Supplier", supplierSchema);
