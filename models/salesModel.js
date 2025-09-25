const mongoose = require("mongoose");

const salesSchema = new mongoose.Schema({
  salesAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel", // correct
    required: true
  },
  customerName: { type: String, required: true, trim: true },
  productName: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  transport: { type: Boolean, default: false },
  paymentType: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now },
  notes: { type: String, trim: true },
  total: { type: Number, required: true, min: 0 }
});

salesSchema.pre("save", function(next) {
  this.total = this.transport 
    ? this.quantity * this.price * 1.05 
    : this.quantity * this.price;
  next();
});

module.exports = mongoose.model("SalesModel", salesSchema);
