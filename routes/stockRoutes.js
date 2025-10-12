const express = require('express');
const router = express.Router();
const stockModel = require('../models/stockModel');
const supplierModel = require('../models/supplierModel');
const StockSubmission = require('../models/stockSubmission');
const upload = require('../middleware/upload');

// =====================================
// GET: Render stock entry form
// =====================================
router.get('/stock', (req, res) => {
  res.render("stock", { title: "Stock Page" });
});

// =====================================
// POST: Manager adds stock → StockSubmission → Stock Collection (with increment)
// =====================================
router.post('/stock', upload.single('image'), async (req, res) => {
  try {
    if (!req.session.user) {
      console.error("User session not found. Cannot submit stock.");
      return res.redirect('/login');
    }

    const {
      productName,
      productType,
      category,
      costPrice,
      sellingPrice,
      quantity,
      supplier,
      supplierEmail,
      supplierContact,
      supplierAddress,
      date,
      quality,
      color,
      measurement
    } = req.body;

    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

    // Calculate sellingPrice if not provided (20% markup)
    const calculatedSellingPrice = sellingPrice
      ? parseFloat(sellingPrice)
      : parseFloat(costPrice) * 1.2;

    // --- Save to StockSubmission ---
    const submission = new StockSubmission({
      productName,
      productType,
      category,
      costPrice: parseFloat(costPrice),
      sellingPrice: calculatedSellingPrice,
      quantity: parseInt(quantity),
      supplier,
      supplierEmail,
      supplierContact,
      supplierAddress,
      date: date || new Date(),
      quality,
      color,
      measurement,
      image: imagePath,
      submittedBy: req.session.user._id,
      status: "Approved",
      approvedBy: req.session.user._id,
      approvedAt: new Date()
    });

    await submission.save();
    console.log(" StockSubmission saved:", submission._id);

    // --- Check if product already exists in main stock collection ---
    const existingStock = await stockModel.findOne({
      productName: productName.trim(),
      productType: productType.trim(),
      category: category.trim()
    });

    if (existingStock) {
      // Increment quantity if product exists
      existingStock.quantity += parseInt(quantity);
      existingStock.costPrice = parseFloat(costPrice);
      existingStock.sellingPrice = calculatedSellingPrice;
      existingStock.date = date || new Date();
      existingStock.image = imagePath || existingStock.image;
      existingStock.quality = quality;
      existingStock.color = color;
      existingStock.measurement = measurement;
      existingStock.supplier = supplier;
      existingStock.supplierEmail = supplierEmail;
      existingStock.supplierContact = supplierContact;
      existingStock.supplierAddress = supplierAddress;
      existingStock.submissionReference = submission._id;

      await existingStock.save();
      console.log(` Stock quantity incremented for ${productName}`);
    } else {
      // If not found, create a new record
      const stockItem = new stockModel({
        productName,
        productType,
        category,
        costPrice: parseFloat(costPrice),
        sellingPrice: calculatedSellingPrice,
        quantity: parseInt(quantity),
        supplier,
        supplierEmail,
        supplierContact,
        supplierAddress,
        date: date || new Date(),
        quality,
        color,
        measurement,
        image: imagePath,
        addedBy: req.session.user._id,
        submissionReference: submission._id
      });

      await stockItem.save();
      console.log(" New stock item saved:", stockItem._id);
    }

    // --- Optional: auto-save supplier ---
    if (supplier && supplier.trim() !== "") {
      const existingSupplier = await supplierModel.findOne({ name: supplier.trim() });
      if (!existingSupplier) {
        const newSupplier = new supplierModel({
          name: supplier.trim(),
          email: supplierEmail,
          contact: supplierContact,
          address: supplierAddress
        });
        await newSupplier.save();
        console.log("New supplier saved:", newSupplier.name);
      }
    }

    res.redirect("/stockList");
  } catch (error) {
    console.error(" Error saving stock submission:", error);
    res.redirect("/stock");
  }
});

// =====================================
// GET: List all stock items (Manager view)
// =====================================
router.get("/stockList", async (req, res) => {
  try {
    const stocks = await stockModel.find().sort({ createdAt: -1 }).lean();

    const totalStockItems = stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalExpenses = stocks.reduce((sum, s) => sum + ((s.quantity || 0) * (s.costPrice || 0)), 0);
    const lowStock = stocks.filter(s => s.quantity < 10);

    res.render("stockList", {
      stock: stocks,
      totalStockItems,
      totalExpenses,
      lowStock
    });
  } catch (err) {
    console.error(" Error fetching stock items:", err);
    res.status(500).send("Server error");
  }
});

// =====================================
// DELETE: Remove a stock submission AND corresponding stock item
// =====================================
router.post("/stock/:id", async (req, res) => {
  try {
    const submissionId = req.params.id;
    await stockModel.findOneAndDelete({ submissionReference: submissionId });
    await StockSubmission.findByIdAndDelete(submissionId);
    res.redirect("/stockList");
  } catch (err) {
    console.error(" Error deleting stock submission:", err);
    res.status(500).send("Server error");
  }
});

// =====================================
// EDIT: Render edit form for stock submission
// =====================================
router.get("/stock-edit/:id", async (req, res) => {
  try {
    const submission = await StockSubmission.findById(req.params.id).lean();
    res.render("stockEdit", { stock: submission });
  } catch (err) {
    console.error(" Error fetching stock submission for edit:", err);
    res.status(500).send("Server error");
  }
});

// =====================================
// UPDATE STOCK SUBMISSION AND STOCK ITEM
// =====================================
router.post("/stock/update/:id", upload.single('image'), async (req, res) => {
  try {
    const {
      productName,
      productType,
      category,
      quantity,
      costPrice,
      sellingPrice,
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
      sellingPrice,
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

    await StockSubmission.findByIdAndUpdate(req.params.id, updateData);
    await stockModel.findOneAndUpdate(
      { submissionReference: req.params.id },
      updateData
    );

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
      }
    }

    res.redirect("/stockList");
  } catch (err) {
    console.error(" Error updating stock submission:", err);
    res.status(500).send("Server error");
  }
});

// =====================================
// PRODUCTS GALLERY (Render Page)
// =====================================
router.get("/products", async (req, res) => {
  try {
    const products = await stockModel.find().sort({ createdAt: -1 }).lean();
    res.render("products", {
      title: "MWF — Products Gallery",
      products,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Server error");
  }
});

// =====================================
// PRODUCTS API (JSON Data)
// =====================================
router.get("/products/api", async (req, res) => {
  try {
    const products = await stockModel.find().sort({ createdAt: -1 }).lean();
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
    const product = await stockModel.findById(req.params.id).lean();
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
