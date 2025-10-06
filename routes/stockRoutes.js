const express = require('express');
const router = express.Router();
const stockModel = require('../models/stockModel');
const { generateReport } = require("./reportRoutes"); // import report generator
const UserModel = require("../models/userModel");
const upload = require('../middleware/upload'); // Your existing upload middleware

// GET: Render stock entry form
// ensureauthenticated, ensureManager
router.get('/stock', (req, res) => { 
  res.render("stock", { title: "Stock Page" });
});

// POST: Save stock to DB with image upload
// ensureauthenticated, ensureManager,
router.post('/stock', upload.single('image'), async (req, res) => { 
  try {
    console.log("Received data:", req.body);
    console.log("Uploaded file:", req.file);

    const stock = new stockModel({
      productName: req.body.productName,
      productType: req.body.productType,
      category: req.body.category,
      costPrice: req.body.costPrice,
      quantity: req.body.quantity,
      supplier: req.body.supplier,
      date: req.body.date,
      quality: req.body.quality,
      color: req.body.color,
      measurement: req.body.measurement,
      image: req.file ? `/uploads/${req.file.filename}` : '' // Add image path if file uploaded
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
    const stock = await stockModel.find().sort({$natural:-1});
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
    res.redirect("/stockList");
  } catch (err) {
    console.error("Error deleting stock:", err);
    res.status(500).send("Server error");
  }
});

router.get("/stock-edit/:id", async (req, res) => {
  try {
    const stock = await stockModel.findById(req.params.id);
    res.render("stockEdit", { stock }); // Fixed: changed { user } to { stock }
  } catch (err) {
    console.error("Error fetching stock for edit:", err);
    res.status(500).send("Server error");
  }
});

// UPDATE STOCK with image upload
router.post("/stock/update/:id", upload.single('image'), async (req, res) => {
  try {
    const { 
      productName, 
      productType, 
      category, 
      quantity, 
      costPrice, 
      supplier, 
      date, 
      quality, 
      color, 
      measurement 
    } = req.body;

    const updateData = {
      productName,
      productType,
      category,
      quantity,
      costPrice,
      supplier,
      date,
      quality,
      color,
      measurement
    };

    // If a new image is uploaded, add it to update data
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    await stockModel.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/stockList");
  } catch (err) {
    console.error("Error updating stock:", err);
    res.status(500).send("Server error");
  }
});

// GET: Products Gallery - Display all products with images in card layout
router.get("/products", async (req, res) => {
  try {
    const products = await stockModel.find().sort({$natural:-1});
    res.render("products", { 
      title: "MWF — Products Gallery",
      products: products,
      user: req.session.user 
    });
  } catch (err) {
    console.error("Error fetching products for gallery:", err);
    res.status(500).send("Server error");
  }
});

// API: Get all products (for AJAX calls)
router.get("/products/api", async (req, res) => {
  try {
    const products = await stockModel.find().sort({$natural:-1});
    res.json({
      success: true,
      data: products,
      message: 'Products retrieved successfully'
    });
  } catch (err) {
    console.error("Error fetching products API:", err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: err.message
    });
  }
});

// API: Get single product
router.get("/products/:id", async (req, res) => {
  try {
    const product = await stockModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    res.json({
      success: true,
      data: product,
      message: 'Product retrieved successfully'
    });
  } catch (err) {
    console.error("Error fetching single product:", err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: err.message
    });
  }
});

// API: Delete product
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await stockModel.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    res.json({
      success: true,
      data: product,
      message: 'Product deleted successfully'
    });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: err.message
    });
  }
});

module.exports = router;