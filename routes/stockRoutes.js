const express = require('express');
const router = express.Router();
const {ensureauthenticated, ensureManager} = require("../middleware/auth");
const stockModel = require('../models/stockModel');
const { generateReport } = require("./reportRoutes"); // import report generator
const StockSubmission = require("../models/stockSubmission");
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
    const stock = new stockModel(req.body);
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
      price,
    });

    res.redirect("/stockList");
  } catch (err) {
    console.error("Error updating stock:", err);
    res.status(500).send("Server error");
  }
})

router.get('/manager-dashboard', (req, res) => { 
  res.render("manager-dashboard",{title:"Manager's dashboard"})
});
router.post('/manager-dashboard', (req, res) => { 
  console.log(req.body)
});


// Get all stock submissions
router.get("/stock-submissions", async (req, res) => {
  try {
    const submissions = await StockSubmission.find()
      .populate("submittedBy", "name") // Get attendant name
      .lean();
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stock submissions" });
  }
});

// Approve a submission
router.post("/stock-submissions/:id/approve", async (req, res) => {
  try {
    const submission = await StockSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    submission.status = "Approved";
    await submission.save();
    res.json({ message: "Stock approved" });
  } catch (err) {
    res.status(500).json({ error: "Error approving stock" });
  }
});

// Reject a submission
router.post("/stock-submissions/:id/reject", async (req, res) => {
  try {
    const submission = await StockSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    submission.status = "Rejected";
    await submission.save();
    res.json({ message: "Stock rejected" });
  } catch (err) {
    res.status(500).json({ error: "Error rejecting stock" });
  }
});



module.exports = router