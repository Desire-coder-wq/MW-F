const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Attendant = require("../models/attendantModel");
const StockSubmission = require("../models/stockSubmission"); // fixed name consistency
const Stock = require("../models/stockModel");
const UserModel = require("../models/userModel");
const { ensureauthenticated, ensureManager, ensureAgent } = require("../middleware/auth");



// ---------------------- Attendants Monitoring ----------------------

// Serve attendants monitoring page
router.get("/attendants", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    // Fetch attendants with user info
    const attendants = await Attendant.find()
      .populate("user", "name email") // populate name & email from UserModel
      .sort({ "user.name": 1 })
      .lean();

    res.render("attendants", { title: "Attendants Monitoring", attendants });
  } catch (err) {
    console.error("Error fetching attendants:", err);
    res.status(500).send("Failed to fetch attendants");
  }
});

// Fetch attendants (JSON)
router.get("/attendants-data", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const attendants = await Attendant.find()
      .populate("user", "name email")
      .sort({ "user.name": 1 })
      .lean();

    res.json(attendants);
  } catch (err) {
    console.error("Error fetching attendants:", err);
    res.status(500).json({ error: "Failed to fetch attendants" });
  }
});

// Toggle attendant status
router.post("/attendants/:id/toggle", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const attendant = await Attendant.findById(req.params.id);
    if (!attendant) return res.status(404).json({ error: "Attendant not found" });

    attendant.status = attendant.status === "Active" ? "Inactive" : "Active";
    attendant.lastActive = new Date();
    await attendant.save();

    res.json({ message: "Status updated", attendant });
  } catch (err) {
    console.error("Error updating attendant status:", err);
    res.status(500).json({ error: "Failed to update attendant status" });
  }
});




// ---------------------- Attendant: Submit Stock ----------------------

// GET - show attendant stock submission form
router.get("/attendant/add-stock", ensureauthenticated, ensureAgent, (req, res) => {
  res.render("attendant-add-stock", { title: "Submit Stock" });
});

// POST - handle attendant submission
router.post("/attendant/add-stock", ensureauthenticated, ensureAgent, async (req, res) => {
  try {
    const submission = new StockSubmission({
      productName: req.body.productName,
      productType: req.body.productType,
      category: req.body.category,
      costPrice: req.body.costPrice,
      quantity: req.body.quantity,
      supplier: req.body.supplier,
      date: req.body.date,
      quality: req.body.quality,
      color: req.body.color,
      measurement: req.body.measurement,
      submittedBy: req.session.user._id,
      status: "Pending"
    });

    await submission.save();
    res.redirect("/attendant-dashboard");
  } catch (err) {
    console.error("Error submitting stock:", err);
    res.status(500).send("Error submitting stock");
  }
});

// ---------------------- Manager: Approve / Reject Stock ----------------------

// GET - show all submissions
router.get("/approve-stock", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const submissions = await StockSubmission.find()
      .populate("submittedBy", "name")
      .sort({ dateSubmitted: -1 })
      .lean();

    res.render("approve-stock", { title: "Approve Stock", submissions });
  } catch (err) {
    console.error("Error fetching stock submissions:", err);
    res.status(500).send("Error fetching stock submissions");
  }
});


// POST - approve submission
router.post("/stock-submissions/:id/approve", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const submission = await StockSubmission.findById(req.params.id);
    if (!submission) return res.status(404).send("Submission not found");

    // mark as approved
    submission.status = "Approved";
    await submission.save();

    // create new stock from submission
    const newStock = new Stock({
      productName: submission.productName,
      productType: submission.productType,
      category: submission.category,
      quantity: submission.quantity,
      costPrice: submission.costPrice,
      supplier: submission.supplier,
      quality: submission.quality,
      color: submission.color,
      measurement: submission.measurement,
      date: new Date() // or use submission.date if it exists
    });

    await newStock.save();

    res.redirect("/approve-stock");
  } catch (err) {
    console.error("Error approving stock:", err);
    res.status(500).send("Error approving stock");
  }
});
// POST - reject submission
router.post("/stock-submissions/:id/reject", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const submission = await StockSubmission.findById(req.params.id);
    if (!submission) return res.status(404).send("Submission not found");

    submission.status = "Rejected";
    await submission.save();

    res.redirect("/approve-stock");
  } catch (err) {
    console.error("Error rejecting stock:", err);
    res.status(500).send("Error rejecting stock");
  }
});







module.exports = router;
