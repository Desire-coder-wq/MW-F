const express = require('express');
const router = express.Router();

const UserModel = require("../models/userModel");
const Sales = require('../models/salesModel');
const Stock = require('../models/stockModel');

const { ensureauthenticated, ensureAgent, ensureManager } = require('../middleware/auth');

// ------------------- GET Sales Entry Form (Attendant only) -------------------
router.get('/sales', ensureauthenticated, ensureAgent, async (req, res) => {
  try {
    const stock = await Stock.find().lean();
    res.render("sales", { 
      title: "Sales Entry", 
      stock,
      user: req.user  // Use req.user consistently
    });
  } catch (err) {
    console.error("Error fetching sales form:", err.message);
    res.status(500).send("Error loading sales form");
  }
});

// ------------------- POST New Sale (Attendant only) -------------------
router.post('/sales', ensureauthenticated, ensureAgent, async (req, res) => {
  try {
    const { customerName, productName, quantity, price, transport, paymentType, date, notes } = req.body;
    const userId = req.user._id;

    // Validate stock
    const stock = await Stock.findOne({ productName });
    if (!stock) return res.status(400).send('No stock found for this product');
    if (stock.quantity < Number(quantity)) return res.status(400).send(`Insufficient stock — only ${stock.quantity} available`);

    // Transport boolean
    const transportRequired = transport.toLowerCase() === "yes";

    // Total calculation
    const total = Number(quantity) * Number(price) * (transportRequired ? 1.05 : 1);

    // Save sale
    const sale = new Sales({
      salesAgent: userId,
      customerName,
      productName,
      quantity: Number(quantity),
      price: Number(price),
      total,
      transport: transportRequired,
      paymentType,
      date,
      notes
    });
    await sale.save();

    // Update stock
    stock.quantity -= Number(quantity);
    await stock.save();

    res.redirect('/sales-list');
  } catch (err) {
    console.error("Error saving sale:", err.message);
    res.status(400).send("Error saving sale: " + err.message);
  }
});

// ------------------- GET Sales List -------------------
router.get('/sales-list', ensureauthenticated, async (req, res) => {
  try {
    const currentUser = req.user;  // Always use req.user
    if (!currentUser) return res.redirect('/login');

    let sales;
    if (currentUser.role === 'manager') {
      sales = await Sales.find()
        .populate('salesAgent', 'name')
        .lean();
    } else {
      sales = await Sales.find({ salesAgent: currentUser._id })
        .populate('salesAgent', 'name')
        .lean();
    }

    res.render('salesList', { sales, user: currentUser });
  } catch (error) {
    console.error("Error fetching sales list:", error.message);
    res.redirect('/');
  }
});

// ------------------- GET Edit Sale Form (Manager only) -------------------
router.get('/sales/edit/:id', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id).lean();
    if (!sale) return res.status(404).send("Sale not found");

    const stock = await Stock.find().lean();
    res.render('editSale', { sale, stock, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading sale");
  }
});

// ------------------- POST Update Sale (Manager only) -------------------
router.post('/sales/edit/:id', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id);
    if (!sale) return res.status(404).send("Sale not found");

    const { customerName, productName, quantity, price, transport, paymentType, date, notes } = req.body;

    // Update stock if product/quantity changed
    if (sale.productName !== productName || sale.quantity != quantity) {
      const oldStock = await Stock.findOne({ productName: sale.productName });
      if (oldStock) {
        oldStock.quantity += sale.quantity;
        await oldStock.save();
      }

      const newStock = await Stock.findOne({ productName });
      if (!newStock) return res.status(400).send("Product not found");
      if (newStock.quantity < Number(quantity)) return res.status(400).send(`Insufficient stock — only ${newStock.quantity} available`);

      newStock.quantity -= Number(quantity);
      await newStock.save();
    }

    // Update sale
    const transportBool = transport.toLowerCase() === 'yes';
    sale.customerName = customerName;
    sale.productName = productName;
    sale.quantity = Number(quantity);
    sale.price = Number(price);
    sale.total = Number(quantity) * Number(price) * (transportBool ? 1.05 : 1);
    sale.transport = transportBool;
    sale.paymentType = paymentType;
    sale.date = date;
    sale.notes = notes;

    await sale.save();
    res.redirect('/sales-list');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating sale");
  }
});

// ------------------- POST Delete Sale (Manager only) -------------------
router.post('/sales/delete/:id', ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id);
    if (!sale) return res.status(404).send("Sale not found");

    // Restore stock
    const stock = await Stock.findOne({ productName: sale.productName });
    if (stock) {
      stock.quantity += sale.quantity;
      await stock.save();
    }

    await sale.deleteOne();
    res.redirect('/sales-list');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting sale");
  }
});

// ------------------- GET Receipt by Sale ID -------------------
router.get('/receipt/:id', ensureauthenticated, async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id)
      .populate('salesAgent', 'name')
      .lean();
    if (!sale) return res.status(404).send("Receipt not found");

    const currentUser = req.user;
    if (currentUser.role !== 'manager' && sale.salesAgent._id.toString() !== currentUser._id.toString()) {
      return res.status(403).send("Not allowed to view this receipt");
    }

    res.render("receipt", { sale, user: currentUser });
  } catch (err) {
    console.error("Error fetching receipt:", err.message);
    res.status(500).send("Error fetching receipt");
  }
});

module.exports = router;
