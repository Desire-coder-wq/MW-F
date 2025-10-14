const express = require("express");
const router = express.Router();
const NotificationManager = require("../utils/notifications");

const Loading = require("../models/loadingModel");
const Stock = require("../models/stockModel");
const Sale = require("../models/salesModel");
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
    const { productName, productType, quantity } = req.body;

    // Find related stock automatically by product name
    const relatedStock = await Stock.findOne({ productName });
    if (!relatedStock) {
      return res.status(404).send("Stock not found for the given product name");
    }

    // Create offloading record
    const record = new Loading({
      productName,
      productType,
      quantity,
      operationType: "offloading",
      attendantName: user.name,
      relatedStock: relatedStock._id,
    });

    await record.save();

    // Update stock quantity
    await Stock.findByIdAndUpdate(relatedStock._id, { $inc: { quantity } });

    // ===== Notify Managers =====
    try {
      // Fetch all managers
      const managers = await require("../models/managerModel").find().lean();

      for (const manager of managers) {
        await NotificationManager.notifyOffloadRequest(
          relatedStock._id,
          req.user._id,
          req.user.name,
          productName,
          quantity,
          manager._id // recipient
        );
      }

      console.log("Offloading notifications sent to manager(s)");
    } catch (notifyError) {
      console.error("Error sending offloading notification:", notifyError);
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

    // Create loading record
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

    // Decrease stock
    await Stock.findOneAndUpdate(
      { productName: sale.productName },
      { $inc: { quantity: -sale.quantity } }
    );

    res.redirect("/loading/report");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ------------------- Loading Report -------------------
router.get("/report", ensureauthenticated, async (req, res) => {
  try {
    const user = req.user;

    const report = await Loading.find()
      .populate({
        path: "relatedSale",
        select: "productName productType quantity customer",
        populate: { path: "customer", select: "name contact" }, // nested populate for customer
      })
      .populate({
        path: "relatedStock",
        select: "productName quantity dateAdded",
      })
      .sort({ dateTime: -1 });

    res.render("loading-report", { report, user });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
