const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  phone: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    trim: true,
    lowercase: true
  },
  contact: {
    type: String,
    default: "",
  },
  address: { 
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