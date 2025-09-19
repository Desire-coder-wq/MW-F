require("dotenv").config(); // 1. Load env variables

// 2. Import dependencies
const express = require("express");
const morgan = require("morgan");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const path = require("path");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");

// Import model
const UserModel = require("./models/userModel");

// Import routes
const authRoutes = require("./routes/authRoutes");
const stockRoutes = require("./routes/stockRoutes");
const indexRoutes = require("./routes/indexRoutes");
const salesRoutes = require("./routes/salesRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");
const manageRoutes = require("./routes/manageRoutes");

// 2. Instantiations
const app = express();
const port = process.env.PORT || 3000;

// 3. Configurations
// Verify MONGODB_URL exists
if (!process.env.MONGODB_URL) {
  console.error(" MONGODB_URL not found in .env");
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
  dbName: "mayondo_wood_and_furniture"
})
.then(() => {
    console.log("✅ Successfully connected to MongoDB");

    // 6. Bootstrapping Server - only after DB connection
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
})
.catch((err) => {
    console.error("❌ MongoDB connection error:", err);
});

// Set view engine to Pug
app.set('view engine','pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(morgan("dev")); // optional logging
app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({ extended:true }));
app.use(express.json());
app.use("/public/uploads", express.static(path.join(__dirname, "public/uploads")));

// Express session configs
app.use(session({
  secret: process.env.SESSION_SECRET || "defaultsecret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URL }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Passport configs
app.use(passport.initialize());
app.use(passport.session());
passport.use(UserModel.createStrategy());
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());

// Using imported routes
app.use('/', authRoutes);
app.use('/', stockRoutes);
app.use('/', indexRoutes);
app.use('/', salesRoutes);
app.use('/', userRoutes);
app.use('/', reportRoutes);
app.use('/', manageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).send('Oops! Route not found');
});
