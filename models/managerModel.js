// models/managerModel.js
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const managerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  gender: String,
  phoneNumber: String,
  nationalID: String,
  nextOfKinName: String,
  nextOfKinNumber: String,
  profilePic: String,
});

managerSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model("Manager", managerSchema);
