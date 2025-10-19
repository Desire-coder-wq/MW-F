const express = require("express");
const router = express.Router();
const passport = require("passport");
const upload = require("../middleware/upload");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// Models
const Notification = require('../models/Notifications');
const User = require("../models/userModel");
const Attendant = require("../models/attendantModel");
const Manager = require("../models/managerModel");
const Settings = require("../models/settingsModel");
const NotificationManager = require("../utils/notifications");

// ---------------------- MIDDLEWARE ----------------------

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated() && req.user) return next();
  if (req.session.user) return next();
  return res.redirect("/login");
}

function ensureManager(req, res, next) {
  const user = req.session.user || req.user;
  if (user && (user.role === "manager" || user.email === process.env.MANAGER_EMAIL)) {
    return next();
  }
  return res.redirect("/");
}

// ---------------------- LOGIN ----------------------

router.get("/login", (req, res) => {
  res.render("login", { title: "Login Page" });
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const manager = await Manager.findOne({ email });
    if (manager) {
      Manager.authenticate()(email, password, (err, user) => {
        if (err) return next(err);
        if (!user) return res.redirect("/login");

        req.logIn(user, (err) => {
          if (err) return next(err);

          req.session.user = {
            _id: user._id,
            email: user.email,
            role: "manager",
            name: user.name,
            profilePic: user.profilePic || "/images/default-avatar.png",
          };

          return res.redirect("/manager-dashboard");
        });
      });
      return;
    }

    const foundUser = await User.findOne({ email });
    if (foundUser) {
      passport.authenticate("local", (err, user) => {
        if (err) return next(err);
        if (!user) return res.redirect("/login");

        req.logIn(user, (err) => {
          if (err) return next(err);
          req.session.user = user;

          if (user.role === "attendant") return res.redirect("/attendant-dashboard");
          if (user.role === "manager") return res.redirect("/manager-dashboard");

          return res.render("noneUser");
        });
      })(req, res, next);
      return;
    }

    return res.redirect("/noneUser");
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send("Server error");
  }
});

// ---------------------- MANAGER DASHBOARD ----------------------

router.get("/manager-dashboard", ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const user = req.session.user || req.user;
    if (!user) return res.redirect("/login");

    console.log('Manager Dashboard - User ID:', user._id);
    console.log('Manager Dashboard - User Role:', user.role);

    let notifications = [];
    let unreadCount = 0;

    try {
      // Ensure managerId is properly converted to ObjectId
      const managerId = mongoose.Types.ObjectId.isValid(user._id) 
        ? new mongoose.Types.ObjectId(user._id) 
        : user._id;

      console.log('Fetching notifications for manager:', managerId);

      // Try using NotificationManager first
      notifications = await NotificationManager.getManagerNotifications(managerId, 10);
      unreadCount = await NotificationManager.getUnreadCount(managerId);

      console.log('Notifications fetched via NotificationManager:', notifications.length);
      console.log('Unread count:', unreadCount);

    } catch (notifErr) {
      console.error("NotificationManager error, using fallback query:", notifErr);

      // Fallback: Direct database query
      const managerId = mongoose.Types.ObjectId.isValid(user._id) 
        ? new mongoose.Types.ObjectId(user._id) 
        : user._id;

      console.log('Using fallback query with managerId:', managerId);

      // Query all notifications to debug
      const allNotifications = await Notification.find({}).limit(5);
      console.log('Sample notifications in DB:', JSON.stringify(allNotifications, null, 2));

      notifications = await Notification.find({
        $or: [
          { recipients: managerId },
          { managerId: managerId },
          { recipients: { $size: 0 } }
        ]
      })
        .populate("initiatedBy", "name email")
        .populate("relatedId")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      console.log('Fallback notifications found:', notifications.length);

      unreadCount = await Notification.countDocuments({
        $or: [
          { recipients: managerId },
          { managerId: managerId },
          { recipients: { $size: 0 } }
        ],
        status: "unread"
      });

      console.log('Fallback unread count:', unreadCount);
    }

    res.render("manager-dashboard", {
      user,
      title: "Manager Dashboard",
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error("Error loading manager dashboard:", error);
    res.status(500).render("error", {
      error: "Failed to load dashboard",
      message: "Please try again later.",
    });
  }
});

// ---------------------- NOTIFICATIONS API ----------------------

router.get("/notifications/api", ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const managerId = mongoose.Types.ObjectId.isValid(user._id) 
      ? new mongoose.Types.ObjectId(user._id) 
      : user._id;
    
    console.log('API: Fetching notifications for manager:', managerId);
    
    let notifications = [];
    let unreadCount = 0;

    try {
      notifications = await NotificationManager.getManagerNotifications(managerId, 20);
      unreadCount = await NotificationManager.getUnreadCount(managerId);
      console.log('API: Notifications from NotificationManager:', notifications.length);
    } catch (error) {
      console.error("API: Error using NotificationManager, fallback query:", error);
      
      notifications = await Notification.find({
        $or: [
          { recipients: managerId },
          { managerId: managerId },
          { recipients: { $size: 0 } }
        ]
      })
        .populate("initiatedBy", "name email")
        .populate("relatedId")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      unreadCount = await Notification.countDocuments({
        $or: [
          { recipients: managerId },
          { managerId: managerId },
          { recipients: { $size: 0 } }
        ],
        status: "unread"
      });

      console.log('API: Fallback notifications found:', notifications.length);
    }

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("API: Error fetching notifications:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/notifications/:id/read", ensureAuthenticated, async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const userId = mongoose.Types.ObjectId.isValid(user._id) 
      ? new mongoose.Types.ObjectId(user._id) 
      : user._id;

    console.log('Marking notification as read:', req.params.id);

    try {
      await NotificationManager.markAsRead(req.params.id, userId);
      console.log('Notification marked as read via NotificationManager');
    } catch (error) {
      console.error("NotificationManager markAsRead error, fallback:", error);
      
      await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          $or: [
            { recipients: userId },
            { managerId: userId },
            { recipients: { $size: 0 } }
          ]
        },
        { $set: { status: "read" } }
      );
      
      console.log('Notification marked as read via fallback');
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/notifications/mark-all-read", ensureAuthenticated, async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const userId = mongoose.Types.ObjectId.isValid(user._id) 
      ? new mongoose.Types.ObjectId(user._id) 
      : user._id;

    console.log('Marking all notifications as read for:', userId);

    try {
      await NotificationManager.markAllAsRead(userId);
      console.log('All notifications marked as read via NotificationManager');
    } catch (error) {
      console.error("NotificationManager markAllAsRead error, fallback:", error);
      
      const result = await Notification.updateMany(
        {
          $or: [
            { recipients: userId },
            { managerId: userId },
            { recipients: { $size: 0 } }
          ],
          status: "unread"
        },
        { $set: { status: "read" } }
      );
      
      console.log('Fallback: Marked', result.modifiedCount, 'notifications as read');
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------- REGISTER (MANAGER ONLY) ----------------------

router.get("/register", ensureAuthenticated, ensureManager, (req, res) => {
  res.render("register", { title: "Register Page" });
});

router.post("/register", ensureAuthenticated, ensureManager, upload.single("profilePic"), async (req, res) => {
  try {
    const {
      name, email, password, role, gender, phoneNumber, nationalID, nextOfKinName, nextOfKinNumber,
    } = req.body;

    if (!name || !email || !password || !gender || !phoneNumber || !nationalID) {
      return res.status(400).send("All required fields must be filled.");
    }

    const profilePic = req.file ? `/uploads/${req.file.filename}` : "/images/default-avatar.png";

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

    const registeredUser = await User.register(newUser, password);

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
    if (error.name === "UserExistsError") {
      return res.status(400).send("A user with this email already exists.");
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).send(`Duplicate field: ${field} already exists.`);
    }

    console.error("Error registering user:", error);
    res.status(500).send("Oops, something went wrong.");
  }
});

// ---------------------- REMAINING ROUTES ----------------------

router.get("/noneUser", (req, res) => {
  res.status(404).render("noneUser", { title: "No User Found" });
});

router.get("/attendant-dashboard", ensureAuthenticated, (req, res) => {
  res.render("attendant-dashboard", {
    user: req.session.user || req.user,
  });
});

// ---------------------- USER LIST ----------------------
router.get("/userlist", ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const users = await User.find().lean();
    res.render("userList", { user: users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------- EDIT/DELETE USER ----------------------
router.get("/user-edit/:id", ensureAuthenticated, ensureManager, async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  res.render("userEdit", { user });
});

router.post("/users/update/:id", ensureAuthenticated, ensureManager, upload.single("profilePic"), async (req, res) => {
  try {
    const { name, email, role, gender, phoneNumber, nationalID, nextOfKinName, nextOfKinPhone } = req.body;
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
    if (req.file) updates.profilePic = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.params.id, updates);
    res.redirect("/userlist");
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).send("Server error");
  }
});

router.post("/users/:id", ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/userlist");
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------- LOGOUT ----------------------
router.get("/logout", (req, res) => {
  res.render("logout", { title: "Confirm Logout" });
});

router.post("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return res.status(500).send("Error logging out");
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
});

// ---------------------- SETTINGS ----------------------
const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "../public/uploads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  }),
});

router.post("/settings/upload-logo", ensureAuthenticated, ensureManager, logoUpload.single("logo"), async (req, res) => {
  try {
    const logoPath = `/uploads/${req.file.filename}`;
    let settings = await Settings.findOne({ user: req.session.user._id });
    if (!settings) {
      settings = new Settings({ user: req.session.user._id, invoice: { logo: logoPath } });
    } else {
      settings.invoice.logo = logoPath;
    }
    await settings.save();
    res.json({ success: true, logoUrl: logoPath });
  } catch (err) {
    console.error("Logo upload failed:", err);
    res.status(500).json({ success: false, message: "Logo upload failed" });
  }
});

module.exports = router;