const express = require("express");
const router = express.Router();
const Stock = require("../models/stockModel");
const SalesModel = require("../models/salesModel");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// ---------------- Helper to build date query ----------------
function buildDateQuery(from, to) {
  const query = {};
  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    query.date = { $gte: fromDate, $lte: toDate };
  } else if (from) {
    query.date = { $gte: new Date(from) };
  } else if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    query.date = { $lte: toDate };
  }
  return query;
}

// ---------------- STOCK REPORT ROUTE (unchanged) ----------------
router.get("/reports", async (req, res) => {
  try {
    const { productType, dateFrom, dateTo } = req.query;
    let query = {};

    if (productType) query.productType = productType;
    if (dateFrom && dateTo) {
      query.date = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    }

    const stocks = await Stock.find(query).lean();

    const totalExpenses = await Stock.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ["$costPrice", "$quantity"] } } } }
    ]);

    const totalStock = await Stock.aggregate([
      { $group: { _id: null, count: { $sum: "$quantity" } } }
    ]);

    const lowStock = await Stock.find({ quantity: { $lt: 10 } }).lean();

    res.render("stock-report", {
      stocks,
      totalExpenses: totalExpenses[0]?.total || 0,
      totalStock: totalStock[0]?.count || 0,
      lowStock: lowStock || []
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating report");
  }
});

// ---------------- SALES REPORT DASHBOARD ----------------
router.get("/sales-report", async (req, res) => {
  try {
    const { from, to } = req.query;
    let filter = {};
    if (from || to) filter.date = buildDateQuery(from, to).date;

    const sales = await SalesModel.find(filter).populate("salesAgent").lean();

    // Cards
    const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalSales = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);

    // Top products
    const productMap = {};
    sales.forEach(s => {
      if (!s.productName) return;
      productMap[s.productName] = (productMap[s.productName] || 0) + (s.quantity || 0);
    });
    const topProducts = Object.entries(productMap)
      .map(([name, qty]) => ({ _id: name, totalQuantity: qty }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    // Top agents
    const agentMap = {};
    sales.forEach(s => {
      const agentName = s.salesAgent?.name || "Unknown";
      agentMap[agentName] = (agentMap[agentName] || 0) + (s.total || 0);
    });
    const topAgents = Object.entries(agentMap)
      .map(([agent, revenue]) => ({ _id: agent, totalRevenue: revenue }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const lowStock = await Stock.find({ quantity: { $lt: 10 } }).lean();

    res.render("sales-report", {
      sales,
      totalRevenue,
      totalSales,
      topProducts,
      topAgents,
      lowStock: lowStock || [],
      from,
      to
    });
  } catch (err) {
    console.error("Error loading sales report:", err);
    res.status(500).send("Server error");
  }
});

// ---------------- PDF EXPORT ----------------
router.get("/sales-report/pdf", async (req, res) => {
  try {
    const { from, to } = req.query;
    let filter = {};
    if (from || to) filter.date = buildDateQuery(from, to).date;

    const sales = await SalesModel.find(filter).populate("salesAgent").lean();

    const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalSales = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);

    const doc = new PDFDocument();
    res.setHeader("Content-Disposition", "attachment; filename=sales-report.pdf");
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(20).text("MWF - Sales Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Total Revenue: UGX ${totalRevenue.toLocaleString()}`);
    doc.text(`Total Sales: ${totalSales}`);
    doc.moveDown();

    doc.fontSize(12).text("Date | Customer | Product | Qty | Total (UGX) | Agent");
    doc.moveDown();

    sales.forEach(s => {
      doc.text(
        `${new Date(s.date).toLocaleDateString()} | ${s.customerName || "N/A"} | ${
          s.productName || "N/A"
        } | ${s.quantity || 0} | UGX ${(s.total || 0).toLocaleString()} | ${
          s.salesAgent?.name || "Unknown"
        }`
      );
    });

    doc.end();
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).send("Error generating PDF");
  }
});

// ---------------- EXCEL EXPORT ----------------
router.get("/sales-report/excel", async (req, res) => {
  try {
    const { from, to } = req.query;
    let filter = {};
    if (from || to) filter.date = buildDateQuery(from, to).date;

    const sales = await SalesModel.find(filter).populate("salesAgent").lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Customer", key: "customerName", width: 20 },
      { header: "Product", key: "productName", width: 20 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Total (UGX)", key: "total", width: 15 },
      { header: "Agent", key: "agent", width: 20 }
    ];

    sales.forEach(s => {
      worksheet.addRow({
        date: new Date(s.date).toLocaleDateString(),
        customerName: s.customerName || "N/A",
        productName: s.productName || "N/A",
        quantity: s.quantity || 0,
        total: s.total || 0,
        agent: s.salesAgent?.name || "Unknown"
      });
    });

    res.setHeader("Content-Disposition", "attachment; filename=sales-report.xlsx");
    res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error generating Excel:", err);
    res.status(500).send("Error generating Excel");
  }
});

module.exports = router;
