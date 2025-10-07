const express = require('express');
const router = express.Router();
const moment = require("moment");
const UserModel = require("../models/userModel");
const Sales = require('../models/salesModel');
const Stock = require('../models/stockModel');
const Customer = require('../models/customerModel'); // Add this

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
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      productName,
      productType,
      quantity,
      price,
      transport,
      paymentType,
      date,
      notes
    } = req.body;
    const userId = req.user._id;

    const stock = await Stock.findOne({ productName });
    if (!stock) return res.status(400).send('No stock found for this product');
    if (stock.quantity < Number(quantity))
      return res.status(400).send(`Insufficient stock — only ${stock.quantity} available`);

    const transportRequired = transport.toLowerCase() === "yes";
    const total = Number(quantity) * Number(price) * (transportRequired ? 1.05 : 1);

    const sale = new Sales({
      salesAgent: userId,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: customerAddress
      },
      productName,
      productType,
      quantity: Number(quantity),
      price: Number(price),
      total,
      transport: transportRequired,
      paymentType,
      date,
      notes
    });
    await sale.save();

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



// ===================================================
// 📜 ROUTE: List all invoices
// ===================================================
router.get("/invoices", async (req, res) => {
  try {
    // 1️⃣ Fetch all sales as invoices
    const sales = await Sales.find().populate("salesAgent", "name").lean();

    // 2️⃣ Format invoices for display
    const invoices = sales.map((sale) => ({
      id: sale._id,
      invoiceNumber: `MWF-${moment(sale.date).format("YYYYMMDD")}-${sale._id
        .toString()
        .slice(-4)}`,
      date: moment(sale.date).format("MMM DD, YYYY"),
      customer: sale.customerName || "Walk-in Customer",
      amount: sale.total || 0,
      status: sale.paymentType?.toLowerCase() === "cash" ? "paid" : "pending",
      items: sale.quantity || 1,
      paymentMethod: sale.paymentType || "Unknown",
    }));

    // 3️⃣ Compute statistics
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const pendingInvoices = invoices.filter(
      (i) => i.status === "pending"
    ).length;
    const paidInvoices = invoices.filter((i) => i.status === "paid").length;
    const thisMonthInvoices = invoices.filter((i) =>
      moment(i.date, "MMM DD, YYYY").isSame(moment(), "month")
    ).length;

    // 4️⃣ Render invoices page
    res.render("invoices", {
      title: "MWF — Invoices & Receipts",
      user: req.user || { name: "Admin" },
      invoices,
      totalRevenue,
      pendingInvoices,
      paidInvoices,
      thisMonthInvoices,
    });
  } catch (err) {
    console.error(" Error fetching invoices:", err.message);
    res.status(500).send("Error fetching invoices");
  }
});

// ===================================================
//  ROUTE: View a single invoice by ID
// ===================================================
router.get("/invoice/:id", async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id)
      .populate("salesAgent", "name")
      .lean();

    if (!sale) return res.status(404).send("Invoice not found");

    // Format invoice details
    const invoice = {
      id: sale._id,
      invoiceNumber: `MWF-${moment(sale.date).format("YYYYMMDD")}-${sale._id
        .toString()
        .slice(-4)}`,
      date: moment(sale.date).format("MMM DD, YYYY"),
      dueDate: moment(sale.date).add(10, "days").format("MMM DD, YYYY"),
      customer: {
        name: sale.customerName || "Client",
        address: sale.notes || "Mbarara, Uganda",
        phone: sale.phone || "+256-700000000",
        email: "client@mwf.co.ug",
      },
      items: [
        {
          name: sale.productName || "Product",
          description: "Product sold",
          quantity: sale.quantity || 1,
          unitPrice: sale.price || 0,
          amount: sale.total || 0,
        },
      ],
      transportFee: sale.transport ? 5 : 0,
      status: sale.paymentType?.toLowerCase() === "cash" ? "paid" : "pending",
      paymentMethod: sale.paymentType || "Unknown",
    };

    res.render("invoice-detail", {
      title: `Invoice ${invoice.invoiceNumber}`,
      user: req.user || { name: "Manager" },
      invoice,
    });
  } catch (err) {
    console.error(" Error fetching invoice:", err.message);
    res.status(500).send("Error fetching invoice");
  }
});

module.exports = router;
