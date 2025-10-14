require("dotenv").config();

// Core dependencies
const express = require("express");
const morgan = require("morgan");
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const path = require("path");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const moment = require("moment");
const http = require("http");
const socketIo = require("socket.io");

// Models
const UserModel = require("./models/userModel");

const NotificationManager = require("./utils/notifications");
const Stock = require('./models/stockModel');



// Function to check low stock and notify
async function checkLowStockAndNotify() {
  try {
    const lowStockItems = await Stock.find({ 
      quantity: { $lt: 10 } // Threshold for low stock
    });

    for (const item of lowStockItems) {
      await NotificationManager.notifyLowStock({
        materialName: item.name,
        currentQuantity: item.quantity,
        materialId: item._id
      });
    }
  } catch (error) {
    console.error("Error checking low stock:", error);
  }
}

// Check low stock every hour
setInterval(checkLowStockAndNotify, 60 * 60 * 1000);

// Also check on server start
checkLowStockAndNotify();


// Routes
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

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Make socket globally accessible
global.io = io;

io.on("connection", (socket) => {
  console.log(" A user connected");
  socket.on("disconnect", () => {
    console.log(" User disconnected");
  });
});

// Connect MongoDB
if (!process.env.MONGODB_URL) {
  console.error("Missing MONGODB_URL in .env");
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URL, {
  dbName: "mayondo_wood_and_furniture"
})
.then(() => {
  console.log(" Successfully connected to MongoDB");
  server.listen(port, () => {
    console.log(` Server running on port ${port}`);
  });
})
.catch((err) => {
  console.error(" MongoDB connection error:", err);
});

// View engine setup
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET || "defaultsecret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URL }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Passport config
app.use(passport.initialize());
app.use(passport.session());
passport.use(UserModel.createStrategy());
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());

// Routes
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

// 404
app.use((req, res) => {
  res.status(404).send("Oops! Route not found");
});
