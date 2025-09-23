const express = require('express');
const router = express.Router();
const stockModel = require('../models/stockModel');
const { generateReport } = require("./reportRoutes"); // import report generator
const UserModel = require("../models/userModel");

// GET: Render stock entry form
// ensureauthenticated, ensureManager
router.get('/stock', (req, res) => { 
  res.render("stock", { title: "Stock Page" });
});

// POST: Save stock to DB, then redirect to stockList
// ensureauthenticated, ensureManager,
router.post('/stock', async (req, res) => { 
  try {
    console.log("Received data:", req.body);
    const stock = new stockModel({
  productName: req.body.productName,
  productType: req.body.productType,
  category: req.body.category,
  costPrice: req.body.costPrice,   // map "price" field into costPrice
  quantity: req.body.quantity,
  supplier: req.body.supplier,
  date: req.body.date,
  quality: req.body.quality,
  color: req.body.color,
  measurement: req.body.measurement
});
    await stock.save();
    console.log("Saved stock:", stock);

    // go straight to stockList after saving
    res.redirect("/stockList");
  } catch (error) {
    console.error("Error saving stock:", error);
    res.redirect("/stock");
  }
});

// GET: List all stock items (render with Pug)
// ensureauthenticated,ensureManager
router.get("/stockList", async (req, res) => {
  try {
    const stock = await stockModel.find().sort({$natural:-1});  // fetch from MongoDB  // stockModel.find().sort({$natural:-1});
    res.render("stockList", { stock });
  } catch (err) {
    console.error("Error fetching stock:", err);
    res.status(500).send("Server error");
  }
});

// DELETE: Remove stock from MongoDB
router.post("/stock/:id", async (req, res) => {
  try {
    await stockModel.findByIdAndDelete(req.params.id);
    res.redirect("/stockList"); // make sure this matches your pug route
  } catch (err) {
    console.error("Error deleting stock:", err);
    res.status(500).send("Server error");
  }
});

router.get("/stock-edit/:id", async (req, res) => {
  const stock = await stockModel.findById(req.params.id);
  res.render("stockEdit", { user });
});

// UPDATE STOCK
router.post("/stock/update/:id", async (req, res) => {
  try {
    const { productName, productType, category,quantity,price } = req.body;

    await stockModel.findByIdAndUpdate(req.params.id, {
      productName,
      productType,
      category,
      quantity,
      costPrice,
      supplier,
      date,
      quality,
      color,
      measurement,

    });

    res.redirect("/stockList");
  } catch (err) {
    console.error("Error updating stock:", err);
    res.status(500).send("Server error");
  }
})







module.exports = router