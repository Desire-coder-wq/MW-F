const express = require("express");
const router = express.Router();

const loadingModel = require("../models/loadingModel");
const stockModel = require("../models/stockModel");
const salesModel = require("../models/salesModel");

// ------------------- OFFLOADING -------------------
// Show form
router.get("/offload", (req, res) => {
  res.render("offload-form"); // views/offload-form.pug
});

// Handle submission
router.post("/offload", async (req, res) => {
  try {
    const { productName, productType, quantity, attendantName, relatedStock } = req.body;

    // Save record
    const record = new loadingModel({
      productName,
      productType,
      quantity,
      operationType: "offloading",
      attendantName,
      relatedStock
    });
    await record.save();

    // Increase stock
    await stockModel.findByIdAndUpdate(relatedStock, { $inc: { quantity: quantity } });

    res.redirect("/loading/report");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ------------------- LOADING -------------------
// List all sales that need loading
router.get("/pending", async (req, res) => {
  try {
    // You can filter for only unpaid or not-yet-loaded sales
    const sales = await salesModel.find();
    res.render("pending-sales", { sales });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
// Show form (need saleId so we know which sale we’re loading)
router.get("/load/:saleId", async (req, res) => {
  try {
    const sale = await salesModel.findById(req.params.saleId);
    if (!sale) return res.status(404).send("Sale not found");

    res.render("load-form", { sale }); // views/load-form.pug
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Handle submission
router.post("/load/:saleId", async (req, res) => {
  try {
    const { attendantName } = req.body;
    const sale = await salesModel.findById(req.params.saleId);
    if (!sale) return res.status(404).send("Sale not found");

    // Save record
    const record = new loadingModel({
      productName: sale.productName,
      productType: sale.productType,
      quantity: sale.quantity,
      operationType: "loading",
      attendantName,
      relatedSale: sale._id
    });
    await record.save();

    // Decrease stock
    await stockModel.findOneAndUpdate(
      { productName: sale.productName },
      { $inc: { quantity: -sale.quantity } }
    );

    res.redirect("/loading/report");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ------------------- REPORT -------------------
router.get("/report", async (req, res) => {
  try {
    const report = await loadingModel.find().populate("relatedSale").populate("relatedStock");
    res.render("loading-report", { report }); // views/loading-report.pug
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
