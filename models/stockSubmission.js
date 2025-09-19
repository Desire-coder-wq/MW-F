const mongoose = require("mongoose");

const stockSubmissionSchema = new mongoose.Schema({
  item: { 
    type: String,
    required: true 
},

  quantity: {
     type: Number, 
     required: true 
    },

  submittedBy: { 
    type: mongoose.Schema.Types.ObjectId,
     ref: "UserModel",
      required: true },

  dateSubmitted: { 
    type: Date, 
    default: Date.now
 },

  status: { 
    type: String,
     enum: ["Pending", "Approved", "Rejected"], 
     default: "Pending" }
});

module.exports = mongoose.model("stockSubmission", stockSubmissionSchema);
