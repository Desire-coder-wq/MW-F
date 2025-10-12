// routes/reportsRoutes.js

const express = require("express");
const router = express.Router();
const Stock = require("../models/stockModel");
const StockSubmission = require("../models/stockSubmission");
const SalesModel = require("../models/salesModel");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// Import your authentication middleware
const { ensureManager } = require("../middleware/auth");

/* =======================================================
    HELPER: Date Query Builder
======================================================= */
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

/* =======================================================
    STOCK REPORT DASHBOARD
======================================================= */
router.get("/reports", ensureManager, async (req, res) => {
  try {
    const { productType, dateFrom, dateTo } = req.query;

    const dateQuery = buildDateQuery(dateFrom, dateTo);
    const filter = {};
    if (productType) filter.productType = productType;
    if (dateQuery.date) filter.date = dateQuery.date;

    const stockSubmissions = await StockSubmission.find(filter)
      .sort({ date: -1 })
      .lean();

    const aggregatedSubmissions = await StockSubmission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$productName",
          productName: { $first: "$productName" },
          productType: { $first: "$productType" },
          category: { $first: "$category" },
          supplier: { $first: "$supplier" },
          costPrice: { $first: "$costPrice" },
          totalSubmittedQuantity: { $sum: "$quantity" },
          submissionCount: { $sum: 1 },
          lastSubmission: { $max: "$date" },
        },
      },
      { $sort: { productName: 1 } },
    ]);

    const currentStocks = await Stock.find({}).lean();

    const totalStockItems = currentStocks.reduce(
      (sum, s) => sum + (s.quantity || 0),
      0
    );
    const totalExpenses = currentStocks.reduce(
      (sum, s) => sum + (s.quantity || 0) * (s.costPrice || 0),
      0
    );
    const lowStock = currentStocks.filter((s) => (s.quantity || 0) < 10);

    const chartData = JSON.stringify(
      currentStocks.map((s) => ({
        productName: s.productName,
        productType: s.productType,
        quantity: s.quantity || 0,
        category: s.category,
      }))
    );

    res.render("stock-report", {
      stocks: stockSubmissions,
      aggregatedStocks: aggregatedSubmissions,
      currentStocks,
      totalStockItems,
      totalExpenses,
      lowStock,
      chartData,
      productType,
      dateFrom,
      dateTo,
    });
  } catch (err) {
    console.error(" Error generating stock report:", err);
    res.status(500).send("Error generating stock report");
  }
});

/* =======================================================
   STOCK REPORT - PDF EXPORT
======================================================= */
router.get("/reports/pdf", ensureManager, async (req, res) => {
  try {
    const { productType, dateFrom, dateTo } = req.query;
    const submissionQuery = {};
    if (productType) submissionQuery.productType = productType;
    if (dateFrom || dateTo)
      submissionQuery.date = buildDateQuery(dateFrom, dateTo).date;

    const aggregatedSubmissions = await StockSubmission.aggregate([
      { $match: submissionQuery },
      {
        $group: {
          _id: "$productName",
          productName: { $first: "$productName" },
          productType: { $first: "$productType" },
          supplier: { $first: "$supplier" },
          costPrice: { $first: "$costPrice" },
          totalSubmittedQuantity: { $sum: "$quantity" },
        },
      },
    ]);

    const currentStocks = await Stock.find({}).lean();

    const totalStockItems = currentStocks.reduce(
      (sum, s) => sum + (s.quantity || 0),
      0
    );
    const totalExpenses = currentStocks.reduce(
      (sum, s) => sum + (s.quantity || 0) * (s.costPrice || 0),
      0
    );
    const lowStock = currentStocks.filter((s) => (s.quantity || 0) < 10);

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader("Content-Disposition", "attachment; filename=stock-report.pdf");
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(20).text("MWF STOCK REPORT", { align: "center" }).moveDown(1);
    doc.fontSize(14).text(`Total Stock Items: ${totalStockItems}`);
    doc.text(`Total Stock Value: UGX ${totalExpenses.toLocaleString()}`);
    doc.text(`Low Stock Items (<10): ${lowStock.length}`).moveDown(1);

    if (lowStock.length > 0) {
      doc.fontSize(14).text("⚠ Low Stock Alerts:", { underline: true });
      lowStock.forEach((item) =>
        doc.text(`  • ${item.productName} - ${item.quantity} units left`)
      );
      doc.moveDown();
    }

    doc.fontSize(16).text(" Stock Summary", { underline: true }).moveDown(0.5);

    aggregatedSubmissions.forEach((s) => {
      const currentItem = currentStocks.find(
        (c) => c.productName === s.productName
      );
      const currentQty = currentItem ? currentItem.quantity : 0;
      doc.fontSize(12).text(
        `${s.productName} (${s.productType}) - Submitted: ${
          s.totalSubmittedQuantity
        } | Current: ${currentQty} | UGX ${(s.costPrice || 0).toLocaleString()}`
      );
    });

    doc.end();
  } catch (err) {
    console.error("Error generating stock PDF:", err);
    res.status(500).send("Error generating stock PDF");
  }
});

/* =======================================================
   STOCK REPORT - EXCEL EXPORT
======================================================= */
router.get("/reports/excel", ensureManager, async (req, res) => {
  try {
    const { productType, dateFrom, dateTo } = req.query;
    const submissionQuery = {};
    if (productType) submissionQuery.productType = productType;
    if (dateFrom || dateTo)
      submissionQuery.date = buildDateQuery(dateFrom, dateTo).date;

    const aggregatedSubmissions = await StockSubmission.aggregate([
      { $match: submissionQuery },
      {
        $group: {
          _id: "$productName",
          productName: { $first: "$productName" },
          productType: { $first: "$productType" },
          supplier: { $first: "$supplier" },
          costPrice: { $first: "$costPrice" },
          totalSubmittedQuantity: { $sum: "$quantity" },
        },
      },
    ]);

    const currentStocks = await Stock.find({}).lean();
    const totalStockItems = currentStocks.reduce(
      (sum, s) => sum + (s.quantity || 0),
      0
    );
    const totalExpenses = currentStocks.reduce(
      (sum, s) => sum + (s.quantity || 0) * (s.costPrice || 0),
      0
    );

    const workbook = new ExcelJS.Workbook();

    const summary = workbook.addWorksheet("Summary");
    summary.columns = [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 25 },
    ];
    summary.addRow({ metric: "Total Stock Items", value: totalStockItems });
    summary.addRow({
      metric: "Total Stock Value (UGX)",
      value: totalExpenses.toLocaleString(),
    });
    summary.addRow({
      metric: "Low Stock Items (<10)",
      value: currentStocks.filter((s) => (s.quantity || 0) < 10).length,
    });

    const lowSheet = workbook.addWorksheet("Low Stock Alerts");
    lowSheet.columns = [
      { header: "Product", key: "productName", width: 25 },
      { header: "Type", key: "productType", width: 15 },
      { header: "Quantity", key: "quantity", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];
    currentStocks
      .filter((s) => (s.quantity || 0) < 10)
      .forEach((item) => {
        lowSheet.addRow({
          productName: item.productName,
          productType: item.productType,
          quantity: item.quantity,
          status: "LOW STOCK",
        });
      });

    const stockSheet = workbook.addWorksheet("Stock Submissions");
    stockSheet.columns = [
      { header: "Product", key: "productName", width: 25 },
      { header: "Type", key: "productType", width: 15 },
      { header: "Supplier", key: "supplier", width: 20 },
      { header: "Submitted Qty", key: "submittedQty", width: 15 },
      { header: "Current Qty", key: "currentQty", width: 15 },
      { header: "Cost Price", key: "costPrice", width: 15 },
    ];

    aggregatedSubmissions.forEach((s) => {
      const current = currentStocks.find((c) => c.productName === s.productName);
      stockSheet.addRow({
        productName: s.productName,
        productType: s.productType,
        supplier: s.supplier,
        submittedQty: s.totalSubmittedQuantity,
        currentQty: current ? current.quantity : 0,
        costPrice: s.costPrice,
      });
    });

    res.setHeader("Content-Disposition", "attachment; filename=stock-report.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(" Error generating stock Excel:", err);
    res.status(500).send("Error generating Excel");
  }
});

/* =======================================================
    SALES REPORT DASHBOARD
======================================================= */
router.get("/sales-report", ensureManager, async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) filter.date = buildDateQuery(from, to).date;

    const sales = await SalesModel.find(filter).populate("salesAgent").lean();

    const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalSales = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);

    const productMap = {};
    sales.forEach((s) => {
      if (s.productName)
        productMap[s.productName] =
          (productMap[s.productName] || 0) + (s.quantity || 0);
    });
    const topProducts = Object.entries(productMap)
      .map(([name, qty]) => ({ _id: name, totalQuantity: qty }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    const agentMap = {};
    sales.forEach((s) => {
      const agent = s.salesAgent?.name || "Unknown";
      agentMap[agent] = (agentMap[agent] || 0) + (s.total || 0);
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
      lowStock,
      from,
      to,
    });
  } catch (err) {
    console.error(" Error generating sales report:", err);
    res.status(500).send("Error generating sales report");
  }
});

/* =======================================================
    SALES REPORT - PDF EXPORT
======================================================= */
router.get("/sales-report/pdf", ensureManager, async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) filter.date = buildDateQuery(from, to).date;

    const sales = await SalesModel.find(filter).populate("salesAgent").lean();
    const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalSales = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader("Content-Disposition", "attachment; filename=sales-report.pdf");
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(20).text("MWF SALES REPORT", { align: "center" }).moveDown();
    doc.fontSize(14).text(`Total Revenue: UGX ${totalRevenue.toLocaleString()}`);
    doc.text(`Total Sales: ${totalSales}`).moveDown();

    doc.fontSize(12).text("Date | Customer | Product | Qty | Total | Agent");
    doc.moveDown(0.5);

    sales.forEach((s) =>
      doc.text(
        `${new Date(s.date).toLocaleDateString()} | ${s.customerName || "N/A"} | ${
          s.productName || "N/A"
        } | ${s.quantity || 0} | UGX ${(s.total || 0).toLocaleString()} | ${
          s.salesAgent?.name || "Unknown"
        }`
      )
    );

    doc.end();
  } catch (err) {
    console.error(" Error generating sales PDF:", err);
    res.status(500).send("Error generating sales PDF");
  }
});

/* =======================================================
    SALES REPORT - EXCEL EXPORT
======================================================= */
router.get("/sales-report/excel", ensureManager, async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) filter.date = buildDateQuery(from, to).date;

    const sales = await SalesModel.find(filter).populate("salesAgent").lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");

    sheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Customer", key: "customerName", width: 20 },
      { header: "Product", key: "productName", width: 20 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Total (UGX)", key: "total", width: 15 },
      { header: "Agent", key: "agent", width: 20 },
    ];

    sales.forEach((s) => {
      sheet.addRow({
        date: new Date(s.date).toLocaleDateString(),
        customerName: s.customerName || "N/A",
        productName: s.productName || "N/A",
        quantity: s.quantity || 0,
        total: s.total || 0,
        agent: s.salesAgent?.name || "Unknown",
      });
    });

    res.setHeader("Content-Disposition", "attachment; filename=sales-report.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(" Error generating sales Excel:", err);
    res.status(500).send("Error generating sales Excel");
  }
});

module.exports = router;
