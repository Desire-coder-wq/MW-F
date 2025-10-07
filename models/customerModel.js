const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contact: { type: String },
  email: { type: String },
  address: { type: String },
  dateAdded: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Customer", customerSchema);
