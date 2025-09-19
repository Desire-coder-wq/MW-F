const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');

const registerSchema = new mongoose.Schema({
  name: { 
    type: String,
    required: true 
  },
  email: {
    type: String,
    required: true,
    unique: true 
  },
  role: {
    type: String,
    enum: ["manager", "attendant",],
  },
  profilePic: {
    type: String,
    default: "/images/default-avatar.png" 
  }
});

// Export Model
registerSchema.plugin(passportLocalMongoose,{
  usernameField:"email"
});
module.exports = mongoose.model('UserModel', registerSchema);
