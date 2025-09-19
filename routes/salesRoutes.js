const express = require('express');
const router = express.Router();

const salesModel = require('../models/salesModel');
const stockModel = require('../models/stockModel');

// ------------------- Middleware -------------------
function checkAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  res.locals.user = req.session.user;
  next();
}

function checkManager(req, res, next) {
  if (req.session.user.role !== 'manager') {
    return res.status(403).send('Not allowed');
  }
  next();
}

// ------------------- GET Sales Entry Form -------------------
router.get('/sales', checkAuth, async (req, res) => {
  try {
    const stock = await stockModel.find().lean();
    res.render("sales", { 
      title: "Sales Entry", 
      stock,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error fetching sales form:", err.message);
    res.status(500).send("Error loading sales form");
  }
});

// ------------------- POST New Sale -------------------
router.post('/sales', checkAuth, async (req, res) => {
  try {
    const { customerName, productName, quantity, price, transport, paymentType, date } = req.body;
    const userId = req.session.user._id; // logged-in sales agent

    // Find stock
    const stock = await stockModel.findOne({ productName });
    if (!stock) {
      return res.status(400).send('No stock found for this product');
    }
    if (stock.quantity < Number(quantity)) {
      return res.status(400).send(`Insufficient Stock — only ${stock.quantity} available`);
    }

    // Calculate total
    let total = Number(quantity) * Number(price);
    if (transport === 'yes') {
      total = total * 1.05; // add 5% transport charge
    }

    // Save sale
    const sale = new salesModel({
      salesAgent: userId,
      customerName,
      productName,
      quantity,
      price,
      total,
      transport: transport === 'yes',
      paymentType,
      date,
    });
    const savedSale = await sale.save();

    // Update stock
    stock.quantity -= Number(quantity);
    await stock.save();

    console.log(" Sale saved successfully:", savedSale);

    // Redirect to sales list
    res.redirect('/sales-list');
  } catch (err) {
    console.error(" Error saving sale:", err.message);
    res.status(400).send("Error saving sale: " + err.message);
  }
});

// ------------------- GET Sales List -------------------
router.get('/sales-list', checkAuth, async (req, res) => {
  try {
    const currentUser = req.session.user;

    let sales;
    if (currentUser.role === 'manager') {
      sales = await salesModel.find()
        .populate('salesAgent', 'name')
        .lean();
    } else {
      sales = await salesModel.find({ salesAgent: currentUser._id })
        .populate('salesAgent', 'name')
        .lean();
    }

    res.render('salesList', { sales, currentUser });
  } catch (error) {
    console.error("Error fetching sales list:", error.message);
    res.redirect('/');
  }
});


// ------------------- GET Edit Sale Form -------------------
router.get('/sales/edit/:id', checkAuth, async (req, res) => {
  try {
    const sale = await salesModel.findById(req.params.id).lean();
    if (!sale) return res.status(404).send("Sale not found");

    // Allow manager or owner
    if (req.session.user.role !== 'manager' && sale.salesAgent.toString() !== req.session.user._id.toString()) {
      return res.status(403).send("Not allowed");
    }

    const stock = await stockModel.find().lean();
    res.render('editSale', { sale, stock });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading sale");
  }
});

// ------------------- POST Update Sale -------------------
router.post('/sales/edit/:id', checkAuth, async (req, res) => {
  try {
    const sale = await salesModel.findById(req.params.id);
    if (!sale) return res.status(404).send("Sale not found");

    if (req.session.user.role !== 'manager' && sale.salesAgent.toString() !== req.session.user._id.toString()) {
      return res.status(403).send("Not allowed");
    }

    const { customerName, productName, quantity, price, transport, paymentType, date } = req.body;

    // Update stock if product/quantity changed
    if (sale.productName !== productName || sale.quantity != quantity) {
      const oldStock = await stockModel.findOne({ productName: sale.productName });
      oldStock.quantity += sale.quantity; // revert old quantity
      await oldStock.save();

      const newStock = await stockModel.findOne({ productName });
      if (!newStock) return res.status(400).send("Product not found");
      if (newStock.quantity < quantity) return res.status(400).send("Insufficient stock");
      newStock.quantity -= quantity;
      await newStock.save();
    }

    sale.customerName = customerName;
    sale.productName = productName;
    sale.quantity = Number(quantity);
    sale.price = Number(price);
    sale.total = Number(quantity) * Number(price) * (transport === 'yes' ? 1.05 : 1);
    sale.transport = transport === 'yes';
    sale.paymentType = paymentType;
    sale.date = date;

    await sale.save();
    res.redirect('/sales-list');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating sale");
  }
});

// ------------------- POST Delete Sale -------------------
router.post('/sales/delete/:id', checkAuth, async (req, res) => {
  try {
    const sale = await salesModel.findById(req.params.id);
    if (!sale) return res.status(404).send("Sale not found");

    if (req.session.user.role !== 'manager' && sale.salesAgent.toString() !== req.session.user._id.toString()) {
      return res.status(403).send("Not allowed");
    }

    // Restore stock
    const stock = await stockModel.findOne({ productName: sale.productName });
    if (stock) {
      stock.quantity += sale.quantity;
      await stock.save();
    }

    await sale.remove();
    res.redirect('/sales-list');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting sale");
  }
});



// ------------------- GET Receipt by Sale ID -------------------
router.get('/receipt/:id', checkAuth, async (req, res) => {
  try {
    const sale = await salesModel.findById(req.params.id)
      .populate('salesAgent', 'name')
      .lean();
    if (!sale) return res.status(404).send("Receipt not found");

    res.render("receipt", { sale });
  } catch (err) {
    console.error("Error fetching receipt:", err.message);
    res.status(500).send("Error fetching receipt");
  }
});

module.exports = router;
