const mongoose = require("mongoose");

const loadingSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productType: { type: String, enum: ["Wood", "furniture"], required: true }, // matches SalesModel
  quantity: { type: Number, required: true },
  operationType: { type: String, enum: ["loading", "offloading"], required: true },
  attendantName: { type: String, required: true },
  relatedSale: { type: mongoose.Schema.Types.ObjectId, ref: "SalesModel", default: null }, // updated ref
  relatedStock: { type: mongoose.Schema.Types.ObjectId, ref: "Stock", default: null },
  customerName: { type: String, default: null },
  dateTime: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Loading", loadingSchema);
