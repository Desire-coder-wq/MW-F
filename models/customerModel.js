const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
 customerName: { 
    type: String, 
    required: true, 
    trim: true 
  },
 customerPhone: { 
    type: String, 
    required: true, 
    trim: true 
  },
  customerEmail: { 
    type: String, 
    trim: true,
    lowercase: true
  },

  customerAddress: { 
    type: String, 
    trim: true 
  },
  dateAdded: { 
    type: Date, 
    default: Date.now 
  }
});

// Create index for better query performance
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });

module.exports = mongoose.model("Customer", customerSchema);