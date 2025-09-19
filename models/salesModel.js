const mongoose = require("mongoose");
const salesSchema = new mongoose.Schema({
  salesAgent: {
     type: mongoose.Schema.Types.ObjectId,
     ref:"UserModel",
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
  }, // unit price
  transport: { 
    type: String,
     },
  paymentType: { 
    type: String,
     required: true 
    },
  
  date: { 
    type: Date,
     required: true
     },
  notes:{
    type:String,

  }
});


module.exports = mongoose.model("SalesModel", salesSchema);
