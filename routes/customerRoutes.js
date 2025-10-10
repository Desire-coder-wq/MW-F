const express = require("express");
const router = express.Router();
const Customer = require("../models/customerModel");
const { ensureauthenticated, ensureManager } = require("../middleware/auth");

// ------ GET Customers List --------
router.get('/customers', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ dateAdded: -1 }).lean();
    res.render("customers", {
      title: "MWF — Customers",
      customers,
      user: req.user,
    });
  } catch (err) {
    console.error("Error fetching customers:", err.message);
    res.status(500).send("Error loading customer list");
  }
});

// ------- DELETE Customer ---------
router.post("/customers/:id/delete", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.redirect("/customers");
  } catch (err) {
    console.error("Error deleting customer:", err.message);
    res.status(500).send("Error deleting customer");
  }
});

module.exports = router;
