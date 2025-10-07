const express = require("express");
const router = express.Router();
const Supplier = require("../models/supplierModel");

// View all suppliers
router.get("/suppliers", async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ $natural: -1 });
    res.render("suppliers", { title: "Suppliers List", suppliers });
  } catch (err) {
    console.error("Error fetching suppliers:", err);
    res.status(500).send("Server Error");
  }
});

// Delete a supplier
router.post("/suppliers/:id/delete", async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.redirect("/suppliers");
  } catch (err) {
    console.error("Error deleting supplier:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
