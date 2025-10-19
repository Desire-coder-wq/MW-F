require("dotenv").config();

// ---------------------- CORE DEPENDENCIES ----------------------
const express = require("express");
const morgan = require("morgan");
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const path = require("path");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const http = require("http");
const socketIo = require("socket.io");

// ---------------------- MODELS & UTILITIES ----------------------
const UserModel = require("./models/userModel");
const Stock = require("./models/stockModel");
const NotificationManager = require("./utils/notifications");

// ---------------------- APP INITIALIZATION ----------------------
const app = express();
const port = process.env.PORT || 3000;

// ---------------------- SOCKET.IO SETUP ----------------------
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
global.io = io;

io.on("connection", (socket) => {
  console.log(" A user connected");
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// ---------------------- DATABASE CONNECTION ----------------------
if (!process.env.MONGODB_URL) {
  console.error("Missing MONGODB_URL in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URL, {
    dbName: "mayondo_wood_and_furniture",
  })
  .then(() => {
    console.log(" Successfully connected to MongoDB");
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error(" MongoDB connection error:", err);
  });

// ---------------------- LOW STOCK CHECK ----------------------
async function checkLowStockAndNotify() {
  try {
    // Find all items where quantity is below 10
    const lowStockItems = await Stock.find({ quantity: { $lt: 10 } });

    // Only notify if we actually have low-stock items
    if (!lowStockItems || lowStockItems.length === 0) {
      console.log(" No low stock items found.");
      return;
    }

    // Send all low stock items to NotificationManager at once
    await NotificationManager.notifyLowStock(lowStockItems);
    console.log("Low stock notifications sent successfully.");
  } catch (error) {
    console.error(" Error checking low stock:", error);
  }
}

// Check immediately on startup
checkLowStockAndNotify();

// Then check every hour
setInterval(checkLowStockAndNotify, 60 * 60 * 1000);

// ---------------------- VIEW ENGINE ----------------------
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// ---------------------- MIDDLEWARE ----------------------
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------------- SESSION CONFIG ----------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultsecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URL }),
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day
  })
);

// ---------------------- PASSPORT CONFIG ----------------------
app.use(passport.initialize());
app.use(passport.session());
passport.use(UserModel.createStrategy());
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());

// ---------------------- ROUTES ----------------------
const supplierRoutes = require("./routes/supplierRoutes");
const customerRoutes = require("./routes/customerRoutes");
const authRoutes = require("./routes/authRoutes");
const stockRoutes = require("./routes/stockRoutes");
const indexRoutes = require("./routes/indexRoutes");
const salesRoutes = require("./routes/salesRoutes");
const userRoutes = require("./routes/userRoutes");
const manageRoutes = require("./routes/manageRoutes");
const loadingRoutes = require("./routes/loadingRoutes");
const reportRoutes = require("./routes/reportRoutes");
const managerRoutes = require("./routes/managerRoutes");
const notificationRoutes = require("./routes/notifications");

app.use("/", authRoutes);
app.use("/", stockRoutes);
app.use("/", indexRoutes);
app.use("/", salesRoutes);
app.use("/", userRoutes);
app.use("/", manageRoutes);
app.use("/loading", loadingRoutes);
app.use("/", reportRoutes);
app.use("/", supplierRoutes);
app.use("/", customerRoutes);
app.use("/manager", managerRoutes);
app.use("/", notificationRoutes);

// ---------------------- 404 HANDLER ----------------------
app.use((req, res) => {
  res.status(404).send("Oops! Route not found.");
});
