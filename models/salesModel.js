const mongoose = require("mongoose");

const salesSchema = new mongoose.Schema({
  salesAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  transport: {
    type: Boolean,   // must be Boolean
    default: false
  },
  paymentType: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  notes: {
    type: String
  },
  total: {
    type: Number ,// store computed total,
     required: true
  }
});

// Attach middleware AFTER schema definition
salesSchema.pre("save", function (next) {
  if (this.transport) {
    this.total = this.quantity * this.price * 1.05; // add 5%
  } else {
    this.total = this.quantity * this.price;
  }
  next();
});

module.exports = mongoose.model("SalesModel", salesSchema);

