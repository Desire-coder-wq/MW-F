const express = require('express');
const router = express.Router();
const moment = require("moment");
const UserModel = require("../models/userModel");
const Sales = require('../models/salesModel');
const Stock = require('../models/stockModel');
const Customer = require('../models/customerModel');
const NotificationManager = require('../utils/notifications');

const { ensureauthenticated, ensureAgent, ensureManager } = require('../middleware/auth');

// ------------------- GET Products with Stock API -------------------
router.get('/api/products-with-stock', ensureauthenticated, async (req, res) => {
  try {
    const products = await Stock.find({}, 'productName productType quantity sellingPrice').lean();
    res.json(products);
  } catch (err) {
    console.error("Error fetching products with stock:", err.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ------------------- GET Sales Entry Form (Attendant only) -------------------
router.get('/sales', ensureauthenticated, ensureAgent, async (req, res) => {
  try {
    const stock = await Stock.find().lean();
    res.render("sales", { 
      title: "Sales Entry", 
      stock,
      user: req.user
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

    // ======= Atomic stock reduction =======
    const stockUpdate = await Stock.findOneAndUpdate(
      { productName, quantity: { $gte: Number(quantity) } },
      { $inc: { quantity: -Number(quantity) } },
      { new: true }
    );
    if (!stockUpdate) return res.status(400).send(`Insufficient stock for ${productName}`);

    const transportRequired = transport.toLowerCase() === "yes";
    const total = Number(quantity) * Number(price) * (transportRequired ? 1.05 : 1);

    // ======= Save or Find Customer =======
    let customer = await Customer.findOne({
      $or: [
        { customerPhone },
        { customerEmail }
      ]
    });

    if (!customer && customerName && customerPhone) {
      customer = new Customer({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : '',
        customerAddress: customerAddress ? customerAddress.trim() : '',
        dateAdded: new Date()
      });
      await customer.save();
    }

    // ======= Save Sale =======
    const sale = new Sales({
      salesAgent: userId,
      customer: {
        customerName,
        customerPhone,
        customerEmail,
        customerAddress
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

    // ======= Notify Managers =======
    try {
      const managers = await UserModel.find({ role: 'manager' }).lean();

      for (const manager of managers) {
        await NotificationManager.notifyPendingSales(
          sale._id,
          req.user._id,
          req.user.name,
          customerName,
          total,
          manager._id
        );

        if (total > 1000) {
          await NotificationManager.notifyLargeSale(
            sale._id,
            req.user._id,
            req.user.name,
            total,
            customerName,
            manager._id
          );
        }
      }
      console.log("Sale notifications sent to manager(s)");
    } catch (notifyError) {
      console.error("Error sending sale notifications:", notifyError);
    }

    // Redirect to customer page instead of sales list (optional)
    res.redirect('/sales-list');
  } catch (err) {
    console.error("Error saving sale:", err.message);
    res.status(400).send("Error saving sale: " + err.message);
  }
});

// ------------------- GET Sales List -------------------
router.get('/sales-list', ensureauthenticated, async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return res.redirect('/login');

    let sales;
    if (currentUser.role === 'manager') {
      sales = await Sales.find().populate('salesAgent', 'name').lean();
    } else {
      sales = await Sales.find({ salesAgent: currentUser._id }).populate('salesAgent', 'name').lean();
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

    const { customerName, customerPhone, customerEmail, customerAddress, productName, quantity, price, transport, paymentType, date, notes } = req.body;

    // Update or Create Customer
    if (customerName && customerPhone) {
      let customer = await Customer.findOne({
        $or: [{ customerPhone }, { customerEmail }]
      });

      if (!customer) {
        customer = new Customer({
          customerName,
          customerPhone,
          customerEmail: customerEmail || '',
          customerAddress: customerAddress || '',
          dateAdded: new Date()
        });
        await customer.save();
      } else {
        customer.customerName = customerName;
        if (customerEmail) customer.customerEmail = customerEmail;
        if (customerAddress) customer.customerAddress = customerAddress;
        await customer.save();
      }
    }

    // Update Stock if needed
    if (sale.productName !== productName || sale.quantity != quantity) {
      await Stock.updateOne(
        { productName: sale.productName },
        { $inc: { quantity: sale.quantity } }
      );

      const updated = await Stock.findOneAndUpdate(
        { productName, quantity: { $gte: Number(quantity) } },
        { $inc: { quantity: -Number(quantity) } },
        { new: true }
      );
      if (!updated) return res.status(400).send(`Insufficient stock for ${productName}`);
    }

    // Update Sale
    const transportBool = transport.toLowerCase() === 'yes';
    sale.customer = { customerName, customerPhone, customerEmail, customerAddress };
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
    await Stock.updateOne(
      { productName: sale.productName },
      { $inc: { quantity: sale.quantity } }
    );

    await sale.deleteOne();
    res.redirect('/sales-list');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting sale");
  }
});

// ------------------- GET Receipt -------------------
router.get('/receipt/:id', ensureauthenticated, async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id).populate('salesAgent', 'name').lean();
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

// ------------------- Invoices -------------------
router.get("/invoices", async (req, res) => {
  try {
    const sales = await Sales.find().populate("salesAgent", "name").lean();
    const invoices = sales.map(sale => ({
      id: sale._id,
      invoiceNumber: `MWF-${moment(sale.date).format("YYYYMMDD")}-${sale._id.toString().slice(-4)}`,
      date: moment(sale.date).format("MMM DD, YYYY"),
      customer: sale.customer.customerName || "Walk-in Customer",
      amount: sale.total || 0,
      status: sale.paymentType?.toLowerCase() === "cash" ? "paid" : "pending",
      items: sale.quantity || 1,
      paymentMethod: sale.paymentType || "Unknown"
    }));

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const pendingInvoices = invoices.filter(i => i.status === "pending").length;
    const paidInvoices = invoices.filter(i => i.status === "paid").length;
    const thisMonthInvoices = invoices.filter(i =>
      moment(i.date, "MMM DD, YYYY").isSame(moment(), "month")
    ).length;

    res.render("invoices", { title: "MWF — Invoices & Receipts", user: req.user || { name: "Admin" }, invoices, totalRevenue, pendingInvoices, paidInvoices, thisMonthInvoices });
  } catch (err) {
    console.error("Error fetching invoices:", err.message);
    res.status(500).send("Error fetching invoices");
  }
});

router.get("/invoice/:id", async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id)
      .populate("salesAgent", "name")
      .lean();
    if (!sale) return res.status(404).send("Invoice not found");

    const invoice = {
      id: sale._id,
      invoiceNumber: `MWF-${moment(sale.date).format("YYYYMMDD")}-${sale._id.toString().slice(-4)}`,
      date: moment(sale.date).format("MMM DD, YYYY"),
      dueDate: moment(sale.date).add(10, "days").format("MMM DD, YYYY"),
      customer: {
        name: sale.customer.name || "Client",
        address: sale.customer.address || "Mbarara, Uganda",
        phone: sale.customer.phone || "+256-700000000",
        email: sale.customer.email || "client@mwf.co.ug",
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
