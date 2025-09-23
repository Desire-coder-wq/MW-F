// models/stockSubmission.js
const mongoose = require("mongoose");

const stockSubmissionSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },             // productName
    productType: { type: String, required: true },
    category: { type: String, required: true },
    costPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    supplier: { type: String, required: true },
    date: { type: Date, required: true },               // submission date
    quality: { type: String },
    color: { type: String },
    measurement: { type: String },
    submittedBy: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendant",
      required: true
    },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockSubmission", stockSubmissionSchema);
