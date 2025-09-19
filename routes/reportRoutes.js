const express = require("express");
const router = express.Router();
const Stock = require("../models/stockModel");

router.get("/stock-report", async (req, res) => {
  try {
    // Expenses by product
    const productExpenses = await Stock.aggregate([
      { $group: { _id: "$item", totalExpense: { $sum: "$cost" } } }
    ]);

    // Quantity by product
    const productQuantities = await Stock.aggregate([
      { $group: { _id: "$item", totalQuantity: { $sum: "$quantity" } } }
    ]);

    // Total stock quantity (all products combined)
    const totalQuantity = productQuantities.reduce(
      (sum, q) => sum + q.totalQuantity,
      0
    );

    // Total Expenses (all products combined)
    const totalExpenses = productExpenses.reduce(
      (sum, e) => sum + e.totalExpense,
      0
    );

    // Monthly Expenses trend
    const expenseData = await Stock.aggregate([
      {
        $group: {
          _id: { month: { $month: "$date" }, year: { $year: "$date" } },
          total: { $sum: "$cost" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Stock added by attendants
    const attendantData = await Stock.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "attendant",
          foreignField: "_id",
          as: "attendantInfo"
        }
      },
      { $unwind: "$attendantInfo" },
      {
        $group: {
          _id: "$attendantInfo.name",
          totalAdded: { $sum: "$quantity" }
        }
      }
    ]);

    // Pass real values to Pug template
    res.render("stock-report", {
      productExpenses,
      productQuantities,
      totalExpenses,
      totalQuantity,
      expenseData,
      attendantData
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating stock report");
  }
});

module.exports = router;
