const express = require("express");
const router = express.Router();
const passport = require("passport");
const upload = require("../middleware/upload");
const User = require("../models/userModel");
const Attendant = require("../models/attendantModel");

// ---------------------- REGISTER ----------------------

// GET: Register page
router.get("/register", (req, res) => {
  res.render("register", { title: "register page" });
});

// POST: Register new user
router.post("/register", upload.single("profilePic"), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      gender,
      phoneNumber,
      nationalID,
      nextOfKinName,
      nextOfKinNumber,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !gender || !phoneNumber || !nationalID) {
      return res.status(400).send("All required fields must be filled.");
    }

    const profilePic = req.file
      ? `/uploads/${req.file.filename}`
      : "/images/default-avatar.png";

    // Create new user instance
    const newUser = new User({
      name,
      email,
      role: role || "attendant",
      profilePic,
      gender,
      phoneNumber,
      nationalID,
      nextOfKinName: nextOfKinName || "",
      nextOfKinNumber: nextOfKinNumber || "",
    });

    // Register user with passport-local-mongoose
    const registeredUser = await User.register(newUser, password);

    // Only create attendant if role is 'attendant'
    if ((registeredUser.role || "").toLowerCase() === "attendant") {
      const newAttendant = new Attendant({
        user: registeredUser._id,
        status: "Active",
        lastActive: new Date(),
      });
      await newAttendant.save();
    }

    res.redirect("/manager-dashboard");
  } catch (error) {
    // Handle common errors more clearly
    if (error.name === "UserExistsError") {
      return res.status(400).send("A user with this email already exists.");
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res
        .status(400)
        .send(`Duplicate field error: ${field} already exists.`);
    }

    console.error("Error registering user:", error);
    res.status(500).send("Oops, something went wrong.");
  }
});

// ---------------------- LOGIN ----------------------

// GET: Login page
router.get("/login", (req, res) => {
  res.render("login", { title: "login page" });
});

// POST: Login using passport
router.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  (req, res) => {
    req.session.user = req.user;
    const role = (req.user.role || "").toLowerCase();
    if (role === "manager") return res.redirect("/manager-dashboard");
    if (role === "attendant") return res.redirect("/attendant-dashboard");
    res.render("noneUser");
  }
);

// ---------------------- DASHBOARDS ----------------------
router.get("/manager-dashboard", (req, res) => {
  res.render("manager-dashboard", { user: req.session.user });
});

router.get("/attendant-dashboard", (req, res) => {
  res.render("attendant-dashboard", { user: req.session.user });
});

// ---------------------- USER LIST ----------------------
router.get("/userlist", async (req, res) => {
  try {
    const users = await User.find().lean();
    res.render("userList", { user: users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------- DELETE USER ----------------------
router.post("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/userlist");
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------- EDIT USER ----------------------
router.get("/user-edit/:id", async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  res.render("userEdit", { user });
});

// ---------------------- UPDATE USER ----------------------
router.post("/users/update/:id", upload.single("profilePic"), async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      gender,
      phoneNumber,
      nationalID,
      nextOfKinName,
      nextOfKinPhone,
    } = req.body;

    const updates = {
      name,
      email,
      role,
      gender,
      phoneNumber,
      nationalID,
      nextOfKinNumber: nextOfKinPhone || "",
      nextOfKinName: nextOfKinName || "",
    };

    if (req.file) {
      updates.profilePic = `/uploads/attendants/${req.file.filename}`;
    }

    await User.findByIdAndUpdate(req.params.id, updates);
    res.redirect("/userlist");
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------- LOGOUT ----------------------
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return res.status(500).send("Error logging out");
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
});

module.exports = router;
