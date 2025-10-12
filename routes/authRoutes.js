const express = require("express");
const router = express.Router();
const passport = require("passport");
const upload = require("../middleware/upload");
const User = require("../models/userModel");
const Attendant = require("../models/attendantModel");
const Manager = require("../models/managerModel");
const NotificationManager = require('../utils/notifications');

// ---------------------- MIDDLEWARE ----------------------

// Protects all logged-in users
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated() && req.user) return next();
  if (req.session.user) return next();
  return res.redirect("/login");
}

// Protects routes for MANAGER ONLY
function ensureManager(req, res, next) {
  const user = req.session.user || req.user;
  if (user && (user.role === "manager" || user.email === process.env.MANAGER_EMAIL)) {
    return next();
  }
  return res.redirect("/");
}

// ---------------------- REGISTER (MANAGER ONLY) ----------------------
router.get("/register", ensureAuthenticated, ensureManager, (req, res) => {
  res.render("register", { title: "register page" });
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

// ---------------------- LOGIN ----------------------
router.get("/login", (req, res) => {
  res.render("login", { title: "login page" });
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // --- Manager login ---
    const manager = await Manager.findOne({ email });
    if (manager) {
      Manager.authenticate()(email, password, (err, user, options) => {
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

    // --- Attendant/User login ---
    const foundUser = await User.findOne({ email });
    if (foundUser) {
      passport.authenticate("local", (err, user, info) => {
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

// ---------------------- NONE USER ----------------------
router.get("/noneUser", (req, res) => {
  res.status(404).render("noneUser", { title: "No user found" });
});

// ---------------------- MANAGER DASHBOARD ----------------------
router.get('/manager-dashboard', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const user = req.session.user;
    
    // Debug log to check user data
    console.log('User session data:', user);
    
    if (!user) {
      return res.redirect('/login');
    }

    let notifications = [];
    let unreadCount = 0;

    try {
      // Fetch notifications for the current manager
      notifications = await NotificationManager.getManagerNotifications(user._id, 10);
      
      // Get unread count for the current manager
      unreadCount = await NotificationManager.getUnreadCount(user._id);
      
      console.log('Notifications fetched:', notifications.length);
      console.log('Unread count:', unreadCount);
      
    } catch (notifErr) {
      console.error("Error fetching notifications:", notifErr);
      // Continue rendering even if notifications fail
    }

    // Ensure user object has required properties
    const userData = {
      _id: user._id,
      name: user.name || 'Manager',
      email: user.email || '',
      role: user.role || 'manager',
      profileImage: user.profileImage || '/images/default-profile.png'
    };

    res.render('manager-dashboard', {
      user: userData,
      title: 'Manager Dashboard',
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
    
  } catch (error) {
    console.error('Error loading manager dashboard:', error);
    res.status(500).render('error', { 
      error: 'Failed to load dashboard',
      message: 'Please try again later.'
    });
  }
});

// ---------------------- NOTIFICATIONS ----------------------
router.post('/notifications/:id/read', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;
    await NotificationManager.markAsRead(req.params.id, user._id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/notifications/mark-all-read', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;
    await NotificationManager.markAllAsRead(user._id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------- ATTENDANT DASHBOARD ----------------------
router.get("/attendant-dashboard", ensureAuthenticated, (req, res) => {
  res.render("attendant-dashboard", {
    user: req.session.user || req.user,
  });
});

// ---------------------- MANAGER PAGES ----------------------
router.get("/manager/tasks", ensureAuthenticated, ensureManager, (req, res) => {
  res.render("manager-tasks", { user: req.session.user });
});

router.get("/manager/reports", ensureAuthenticated, ensureManager, (req, res) => {
  res.render("manager-reports", { user: req.session.user });
});

router.get("/manager/attendants", ensureAuthenticated, ensureManager, (req, res) => {
  res.render("manager-attendants", { user: req.session.user });
});

router.get("/manager/sales", ensureAuthenticated, ensureManager, (req, res) => {
  res.render("manager-sales", { user: req.session.user });
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
router.get("/settings", ensureAuthenticated, ensureManager, (req, res) => {
  res.render("settings", {
    title: "MWF - Settings",
    user: req.session.user || req.user || { name: "Manager" },
  });
});

module.exports = router;
