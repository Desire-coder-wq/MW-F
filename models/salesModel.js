const mongoose = require("mongoose");

const salesSchema = new mongoose.Schema({
  salesAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true
  },

  //  CUSTOMER INFORMATION
  customer: {
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, trim: true },
   customerEmail: { type: String, trim: true },
   customeraddress: { type: String, trim: true },
  },

  //  PRODUCT INFORMATION
  productName: { type: String, required: true, trim: true },
  productType: { type: String, enum: ["wood", "furniture"], required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },

  //  PAYMENT & TRANSPORT
  transport: { type: Boolean, default: false },
  paymentType: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now },
  notes: { type: String, trim: true },

  //  TOTAL
  total: { type: Number, required: true, min: 0 }
});

salesSchema.pre("save", function (next) {
  this.total = this.transport
    ? this.quantity * this.price * 1.05
    : this.quantity * this.price;
  next();
});

module.exports = mongoose.model("SalesModel", salesSchema);
