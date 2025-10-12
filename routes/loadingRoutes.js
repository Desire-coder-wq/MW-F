const express = require("express");
const router = express.Router();
const NotificationManager = require('../utils/notifications'); // ADD THIS LINE

const Loading = require("../models/loadingModel");
const Stock = require("../models/stockModel");
const Sale = require("../models/salesModel"); // your actual SalesModel
const Customer = require("../models/customerModel");

const { ensureAgent, ensureauthenticated } = require("../middleware/auth");

// ------------------- OFFLOADING -------------------
router.get("/offload", ensureAgent, async (req, res) => {
  try {
    const user = req.user;
    const stocks = await Stock.find().sort({ dateAdded: -1 });
    res.render("offload-form", { user, stocks });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post("/offload", ensureAgent, async (req, res) => {
  try {
    const user = req.user;
    const { productName, productType, quantity, relatedStock } = req.body;

    const record = new Loading({
      productName,
      productType,
      quantity,
      operationType: "offloading",
      attendantName: user.name,
      relatedStock,
    });
    await record.save();

    await Stock.findByIdAndUpdate(relatedStock, { $inc: { quantity } });

    // ======= NOTIFICATION: Notify manager about offloading =======
    try {
      await NotificationManager.notifyOffloadRequest(
        relatedStock,
        req.user._id,
        req.user.name,
        productName,
        quantity
      );
      console.log(" Offloading notification sent to manager");
    } catch (notifyError) {
      console.error("Error sending offloading notification:", notifyError);
      // Don't fail the request if notification fails
    }

    res.redirect("/loading/report");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ------------------- LOADING -------------------
router.get("/pending", ensureAgent, async (req, res) => {
  try {
    const user = req.user;
    const sales = await Sale.find().populate("customer");
    res.render("pending-sales", { sales, user });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/load/:saleId", ensureAgent, async (req, res) => {
  try {
    const user = req.user;
    const sale = await Sale.findById(req.params.saleId).populate("customer");
    if (!sale) return res.status(404).send("Sale not found");

    res.render("load-form", { sale, user });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post("/load/:saleId", ensureAgent, async (req, res) => {
  try {
    const user = req.user;
    const sale = await Sale.findById(req.params.saleId).populate("customer");
    if (!sale) return res.status(404).send("Sale not found");

    const record = new Loading({
      productName: sale.productName,
      productType: sale.productType,
      quantity: sale.quantity,
      operationType: "loading",
      attendantName: user.name,
      relatedSale: sale._id,
      customerName: sale.customer?.name || "N/A",
    });
    await record.save();

    await Stock.findOneAndUpdate(
      { productName: sale.productName },
      { $inc: { quantity: -sale.quantity } }
    );

    res.redirect("/loading/report");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ------------------- REPORT -------------------
router.get("/report", ensureauthenticated, async (req, res) => {
  try {
    const user = req.user;
    const report = await Loading.find()
      .populate({ path: "relatedSale", select: "productName customer" }) // populate correctly
      .populate({ path: "relatedStock", select: "productName quantity" })
      .sort({ dateTime: -1 });

    res.render("loading-report", { report, user });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;