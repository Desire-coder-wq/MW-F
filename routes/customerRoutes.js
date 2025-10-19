const express = require("express");
const router = express.Router();
const Customer = require("../models/customerModel");
const { ensureauthenticated, ensureManager } = require("../middleware/auth");

// ---------------- GET Customers List ----------------
router.get("/customers", ensureauthenticated, ensureManager, async (req, res) => {
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

// ---------------- GET Add Customer Form ----------------
router.get("/customers/add", ensureauthenticated, ensureManager, (req, res) => {
  res.render("addCustomer", {
    title: "MWF — Add Customer",
    user: req.user,
  });
});

// ---------------- POST Add Customer ----------------
router.post("/customers/add", ensureauthenticated, ensureManager, async (req, res) => {
  const { customerName, customerPhone, customerEmail, customerAddress } = req.body;

  // Server-side validation
  if (!customerName || !customerPhone) {
    return res.status(400).send("Customer Name and Phone are required");
  }

  try {
    // Avoid duplicate phone numbers
    const existingCustomer = await Customer.findOne({ customerPhone });
    if (existingCustomer) {
      return res.status(400).send("A customer with this phone number already exists");
    }

    const newCustomer = new Customer({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : "",
      customerAddress: customerAddress ? customerAddress.trim() : "",
    });

    await newCustomer.save();
    res.redirect("/customers");
  } catch (err) {
    console.error("Error adding customer:", err.message);
    res.status(500).send("Error adding customer");
  }
});

// ---------------- GET Edit Customer Form ----------------
router.get("/customers/:id/edit", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) {
      return res.status(404).send("Customer not found");
    }

    res.render("editCustomer", {
      title: "MWF — Edit Customer",
      customer,
      user: req.user,
    });
  } catch (err) {
    console.error("Error fetching customer:", err.message);
    res.status(500).send("Error loading customer");
  }
});

// ---------------- POST Edit Customer ----------------
router.post("/customers/:id/edit", ensureauthenticated, ensureManager, async (req, res) => {
  const { customerName, customerPhone, customerEmail, customerAddress } = req.body;

  if (!customerName || !customerPhone) {
    return res.status(400).send("Customer Name and Phone are required");
  }

  try {
    await Customer.findByIdAndUpdate(
      req.params.id,
      {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : "",
        customerAddress: customerAddress ? customerAddress.trim() : "",
      },
      { new: true, runValidators: true }
    );

    res.redirect("/customers");
  } catch (err) {
    console.error("Error updating customer:", err.message);
    res.status(500).send("Error updating customer");
  }
});

// ---------------- DELETE Customer ----------------
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
