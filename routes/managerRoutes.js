const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Manager = require("../models/managerModel");

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/managers");
  },
  filename: (req, file, cb) => {
    cb(null, "profile-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// GET: Update profile page
router.get("/update-profile", async (req, res) => {
  const manager = await Manager.findOne();
  res.render("manager-update-profile", {
    user: manager || { name: "", profilePic: "/images/default-profile.png" },
  });
});

// POST: Update profile
router.post("/update-profile", upload.single("profilePic"), async (req, res) => {
  try {
    const manager = await Manager.findOne();
    if (!manager) {
      return res.status(404).send("Manager not found");
    }

    if (req.body.name) manager.name = req.body.name;
    if (req.file) {
      manager.profilePic = "/uploads/managers/" + req.file.filename;
    }

    await manager.save();
    res.redirect("/manager-dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating profile");
  }
});

module.exports = router;
