const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const registerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  nationalId: { type: String, required: true, unique: true },
  nextOfKinName: { type: String },
  nextOfKinNumber: { type: String },
  phoneNumber: { type: String },
  role: { type: String, enum: ["manager", "attendant"], default: "attendant" },
  profilePic: { type: String, default: "/images/default-avatar.png" },
});

// This adds username & hashed password fields automatically
registerSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model("UserModel", registerSchema);
