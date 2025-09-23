const express = require("express");
const router = express.Router();
const passport = require("passport");
const path = require("path");
const multer = require("multer");

const UserModel = require("../models/userModel");
const Attendant = require("../models/attendantModel");

// ---------------------- Multer Config ----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/attendants/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ---------------------- REGISTER ----------------------

// GET: Register page
router.get("/register", (req, res) => {
  res.render("register", { title: "register page" });
});

// POST: Register new user (attendant or manager)
router.post("/register", upload.single("profilePic"), async (req, res) => {
  try {
    const { name, email, password, role, gender, phoneNumber, nationalID, nextOfKinName, nextOfKinPhone } = req.body;

    // check if email exists
    let existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Email already exists");
    }

    // fallback to default profile pic
    const profilePic = req.file
      ? `/uploads/attendants/${req.file.filename}`
      : "/images/default-avatar.png";

    // create user
    const newUser = new UserModel({
      name,
      email,
      role: role || "attendant", // default to attendant unless specified
      profilePic,
      gender,
      phoneNumber,
      nationalID,
      nextOfKinName,
      nextOfKinPhone,
    });

    await UserModel.register(newUser, password);

    // if attendant, create attendant record
    if (newUser.role === "attendant") {
      const newAttendant = new Attendant({ user: newUser._id });
      await newAttendant.save();
    }

    res.redirect("/login");
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(400).send("Oops something went wrong");
  }
});

// ---------------------- LOGIN ----------------------
router.get("/login", (req, res) => {
  res.render("login", { title: "login page" });
});

router.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  (req, res) => {
    console.log("Logged in user:", req.user);
    if (!req.user) {
      return res.send("User not set in req.user");
    }

    req.session.user = req.user;
    console.log("Session after login:", req.session);

    if (req.user.role === "manager") {
      console.log("Redirecting to /manager-dashboard");
      return res.redirect("/manager-dashboard");
    } else if (req.user.role === "attendant") {
      console.log("Redirecting to /attendant-dashboard");
      return res.redirect("/attendant-dashboard");
    } else {
      console.log("Redirecting to noneUser");
      return res.render("noneUser");
    }
  }
);

// ---------------------- DASHBOARDS ----------------------
router.get("/manager-dashboard", (req, res) => {
  res.render("manager-dashboard", { user: req.session.user });
});
router.post("/manager-dashboard", (req, res) => {
  console.log(req.body);
});

router.get("/attendant-dashboard", (req, res) => {
  res.render("attendant-dashboard", { user: req.session.user });
});
router.post("/attendant-dashboard", (req, res) => {
  console.log(req.body);
});

// ---------------------- USER LIST ----------------------
router.get("/userlist", async (req, res) => {
  try {
    const users = await UserModel.find().lean();
    res.render("userList", { user: users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Server error");
  }
});

// DELETE USER
router.post("/users/:id", async (req, res) => {
  try {
    await UserModel.findByIdAndDelete(req.params.id);
    res.redirect("/userList");
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send("Server error");
  }
});

// EDIT USER
router.get("/user-edit/:id", async (req, res) => {
  const user = await UserModel.findById(req.params.id);
  res.render("userEdit", { user });
});

// UPDATE USER
router.post("/users/update/:id", async (req, res) => {
  try {
    const { name, email, role, gender, phoneNumber, nationalID, nextOfKinName, nextOfKinPhone } = req.body;

    await UserModel.findByIdAndUpdate(req.params.id, {
      name,
      email,
      role,
      gender,
      phoneNumber,
      nationalID,
      nextOfKinName,
      nextOfKinPhone,
    });

    res.redirect("/userList");
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------- LOGOUT ----------------------
router.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return res.status(500).send("Error logging out");
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
});

// ---------------------- EXTRA TEST FORM ----------------------
router.get("/form", (req, res) => {
  res.render("form", { title: "signup page" });
});
router.post("/form", (req, res) => {
  console.log(req.body);
});

module.exports = router;
