const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const User = require("../models/userModel");
// Multer config for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/"); // save inside /public/uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  }
});
const upload = multer({ storage });

// GET: Profile page (for example current user)
router.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    res.render("profile", { user });
  } catch (err) {
    res.status(500).send("Error loading profile");
  }
});

// POST: Update profile
router.post("/profile/:id", upload.single("profilePic"), async (req, res) => {
  try {
    const updates = {
      name: req.body.name,
      email: req.body.email,
    };

    if (req.file) {
      updates.profilePic = "/uploads/" + req.file.filename; // save file path
    }

    await User.findByIdAndUpdate(req.params.id, updates);
    res.redirect("/dashboard"); // or back to profile modal
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating profile");
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    // assuming you store logged-in user id in req.user._id (Passport.js)
    const user = await User.findById(req.user._id).lean();
    res.render("manager-dashboard", { user });
  } catch (err) {
    res.status(500).send("Error loading dashboard");
  }
});

module.exports = router;
