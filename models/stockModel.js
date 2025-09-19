const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  productName: { 
    type: String, 
    required: true,
     trim: true
 },
  productType:{
  type:String,
  required:true,
 },
 category:{
   type:String,
   required:true,
 },
  quantity: {
     type: Number,
      required: true
     },
  price: {
     type: Number,
     required: true
     }
});

module.exports = mongoose.model('Stock', stockSchema);
