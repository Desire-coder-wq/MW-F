const mongoose = require("mongoose");
const Manager = require("./models/managerModel");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URL)
  .then(async () => {
    const existingManager = await Manager.findOne({ email: "manager@mwf.com" });
    if (existingManager) {
      console.log("Manager already exists!");
      await mongoose.disconnect();
      return process.exit(0);
    }

    const manager = new Manager({
      name: "Asingura Desire",
      email: "manager@mwf.com",
      gender: "Female",
      phoneNumber: "0767625461",
      nationalID: "CF0574745MNRA",
      nextOfKinName: "N/A",
      nextOfKinNumber: "N/A"
    });

    await Manager.register(manager, "asi123"); // password hashed automatically

    console.log("First manager created successfully!");
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  });
