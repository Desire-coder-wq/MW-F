const mongoose = require("mongoose");

const stockSubmissionSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    productType: { type: String, required: true },
    category: { type: String, required: true },
    costPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },

    // Store supplier name directly (optional)
    supplier: { type: String, required: true, trim: true },

    supplierEmail: { type: String },
    supplierContact: { type: String },
    supplierAddress: { type: String },

    date: { type: Date, required: true },
    quality: { type: String },
    color: { type: String },
    measurement: { type: String },

  image: { 
    type: String,
    default: ''
  },
  

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockSubmission", stockSubmissionSchema);
