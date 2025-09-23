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
  costPrice: {
     type: Number,
     required: true
     },
  supplier:{
      type:String,
  },
  quality:{
       type:String,

  },
  color:{
    type:String,
  },
  measurement:{
    type:String,
  },
  date: { 
    type: Date,
     required: true
     },
});

module.exports = mongoose.model('Stock', stockSchema);
