const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const registerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true

   },
  Email: {
    type: String,
    unique: true,
    trim: true
  },

  Role:{
    type: String,       // Change 'string' to 'String'
    required: true
  }
});
// Export Model
registerSchema.plugin(passportLocalMongoose,{
  usernameField:"Email"
});
module.exports = mongoose.model('UserModel', registerSchema);
