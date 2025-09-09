// 1.//Dependencies
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressSession  = require('express-session');
const MongoStore = require('connect-mongo');

require('dotenv').config();
//import model
const UserModel = require("./models/userModel")
//Import routes
const classRoutes = require("./routes/classRoutes");
const authRoutes = require("./routes/authRoutes");
const stockRoutes = require("./routes/stockRoutes");
const indexRoutes = require("./routes/indexRoutes");
const salesRoutes = require("./routes/salesRoutes");
// 2.//Instantiations
const app = express();

const port =3000;

// 3.//Configurations
// settingup mongodb connections
mongoose.connect(process.env.MONGODB_URL, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true
});

mongoose.connection
  .on('open', () => {
    console.log('Sucessfully connected to mongoose');
  })
  .on('error', (err) => {
    console.log(`Connection error: ${err.message}`);
  });
// setting view engine to pug 
app.set('view engine','pug')
app.set('views', path.join(__dirname, 'views'));

// //routing (a path to something)
// app.get('/', (req, res) => { 
//   res.send('Homepage! Hello world.');
// });

// 4.//Middleware
// app.use(express.static('public'));

app.use(express.static(path.join(__dirname,'public')));
//middle ware to parse form data and jason
app.use(express.urlencoded({extended:true})) // helps to pass data from forms
app.use(express.json());
 //expression session configs
app.use(expressSession({
secret: process.env.SESSION_SECRET,
resave:false,
saveUninitialized: false,
store:MongoStore.create({mongoUrl:process.env.MONGODB_URL}),
cookie:{maxAge:24*60*60*1000}//oneday
}))

// passpor configs
app.use(passport.initialize()) //looks out passport.authenticate
app.use(passport.session()) //connects passort to the session created by 

 //authenticate  with passport localstrategy
passport.use(UserModel.createStrategy());
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());


//using imported routes
// 5.//Routes
 app.use('/',classRoutes);
 app.use('/',authRoutes);
 app.use('/',stockRoutes);
 app.use('/',indexRoutes);
 app.use('/',salesRoutes);




 
//non existing  route handler
app.use((req,res)=>{
  res.status(404).send('Oops! Route not found')
}
)

// 6.//Bootstrapping Server
//this should always be the last line in this file.
app.listen(port, () => {
  console.log(`listening on port ${port}`)
});

