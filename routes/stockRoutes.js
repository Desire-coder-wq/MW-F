const express = require('express');
const router = express.Router();
const stockModel = require('../models/stockModel');
const supplierModel = require('../models/supplierModel'); // ✅ new supplier model
const { generateReport } = require("./reportRoutes");
const UserModel = require("../models/userModel");
const upload = require('../middleware/upload');

// =====================================
// GET: Render stock entry form
// =====================================
router.get('/stock', (req, res) => { 
  res.render("stock", { title: "Stock Page" });
});

// =====================================
// POST: Save stock + supplier data
// =====================================
router.post('/stock', upload.single('image'), async (req, res) => { 
  try {
    console.log("Received data:", req.body);
    console.log("Uploaded file:", req.file);

    // --- 1️Save stock data ---
    const stock = new stockModel({
      productName: req.body.productName,
      productType: req.body.productType,
      category: req.body.category,
      costPrice: req.body.costPrice,
      quantity: req.body.quantity,

      // Supplier info (kept for now)
      supplier: req.body.supplier,
      supplierEmail: req.body.supplierEmail,
      supplierContact: req.body.supplierContact,
      supplierAddress: req.body.supplierAddress,

      date: req.body.date,
      quality: req.body.quality,
      color: req.body.color,
      measurement: req.body.measurement,
      image: req.file ? `/uploads/${req.file.filename}` : ''
    });

    await stock.save();
    console.log(" Saved stock:", stock);

    // --- 2️ Auto-save supplier if not already in DB ---
    if (req.body.supplier && req.body.supplier.trim() !== "") {
      const existingSupplier = await supplierModel.findOne({ name: req.body.supplier.trim() });
      if (!existingSupplier) {
        const supplier = new supplierModel({
          name: req.body.supplier,
          email: req.body.supplierEmail,
          contact: req.body.supplierContact,
          address: req.body.supplierAddress
        });
        await supplier.save();
        console.log("New supplier saved:", supplier);
      } else {
        console.log("ℹ Supplier already exists:", existingSupplier.name);
      }
    }

    res.redirect("/stockList");
  } catch (error) {
    console.error(" Error saving stock or supplier:", error);
    res.redirect("/stock");
  }
});

// =====================================
// GET: List all stock items
// =====================================
router.get("/stockList", async (req, res) => {
  try {
    const stock = await stockModel.find().sort({ $natural: -1 });
    res.render("stockList", { stock });
  } catch (err) {
    console.error(" Error fetching stock:", err);
    res.status(500).send("Server error");
  }
});

// =====================================
// DELETE: Remove a stock item
// =====================================
router.post("/stock/:id", async (req, res) => {
  try {
    await stockModel.findByIdAndDelete(req.params.id);
    res.redirect("/stockList");
  } catch (err) {
    console.error(" Error deleting stock:", err);
    res.status(500).send("Server error");
  }
});

// =====================================
// EDIT: Render edit form for stock item
// =====================================
router.get("/stock-edit/:id", async (req, res) => {
  try {
    const stock = await stockModel.findById(req.params.id);
    res.render("stockEdit", { stock });
  } catch (err) {
    console.error(" Error fetching stock for edit:", err);
    res.status(500).send("Server error");
  }
});

// =====================================
// UPDATE STOCK
// =====================================
router.post("/stock/update/:id", upload.single('image'), async (req, res) => {
  try {
    const {
      productName,
      productType,
      category,
      quantity,
      costPrice,
      supplier,
      supplierEmail,
      supplierContact,
      supplierAddress,
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
      supplierEmail,
      supplierContact,
      supplierAddress,
      date,
      quality,
      color,
      measurement
    };

    if (req.file) updateData.image = `/uploads/${req.file.filename}`;

    await stockModel.findByIdAndUpdate(req.params.id, updateData);

    //  Also ensure supplier info is synced
    if (supplier && supplier.trim() !== "") {
      const existingSupplier = await supplierModel.findOne({ name: supplier.trim() });
      if (!existingSupplier) {
        const newSupplier = new supplierModel({
          name: supplier,
          email: supplierEmail,
          contact: supplierContact,
          address: supplierAddress
        });
        await newSupplier.save();
        console.log(" New supplier added from update:", newSupplier);
      }
    }

    res.redirect("/stockList");
  } catch (err) {
    console.error("Error updating stock:", err);
    res.status(500).send("Server error");
  }
});

// =====================================
// PRODUCTS GALLERY (Render Page)
// =====================================
router.get("/products", async (req, res) => {
  try {
    const products = await stockModel.find().sort({ $natural: -1 });
    res.render("products", { 
      title: "MWF — Products Gallery",
      products,
      user: req.session.user 
    });
  } catch (err) {
    console.error(" Error fetching products:", err);
    res.status(500).send("Server error");
  }
});

// =====================================
// PRODUCTS API (JSON Data)
// =====================================
router.get("/products/api", async (req, res) => {
  try {
    const products = await stockModel.find().sort({ $natural: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    console.error(" Error fetching products API:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =====================================
// GET: Single Product (API)
// =====================================
router.get("/products/:id", async (req, res) => {
  try {
    const product = await stockModel.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    console.error(" Error fetching product:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =====================================
// DELETE: Product via API
// =====================================
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await stockModel.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
