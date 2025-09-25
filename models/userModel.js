const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ["manager", "attendant"], default: "attendant" },
  profilePic: { type: String, default: "/images/default-avatar.png" },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  phoneNumber: { type: String, required: true },
  nationalID: { type: String, required: true, unique: true },
  nextOfKinName: { type: String, default: "" },
  nextOfKinNumber: { type: String, default: "" },
}, { timestamps: true });

userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model("UserModel", userSchema);
