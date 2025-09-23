const mongoose = require("mongoose");
const UserModel = require("./models/userModel");
require('dotenv').config();  // load MONGODB_URL from .env

mongoose.connect(process.env.MONGODB_URL)
  .then(async () => {
    const existingManager = await UserModel.findOne({ role: "manager" });
    if (existingManager) {
      console.log("Manager already exists!");
      return process.exit(0);
    }

    const manager = new UserModel({
      name: "Asingura Desire",
      email: "manager@mwf.com",
      role: "manager",
      gender: "Female",
      phoneNumber: "0767625461",
      nationalId: "CF0574745MNRA",
      nextOfKinName: "N/A",
      nextOfKinNumber: "N/A"
    });

    await UserModel.register(manager, "admin123");

    console.log("First manager created successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
