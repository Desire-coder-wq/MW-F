const express = require("express");
const router = express.Router();
const Attendant = require("../models/attendantModel");
const stockSubmission = require("../models/stockSubmission");
const UserModel = require("../models/userModel");
const { ensureauthenticated, ensureManager } = require("../middleware/auth"); // fixed case

// Serve attendants monitoring page
router.get("/attendants", ensureauthenticated, ensureManager, (req, res) => {
  res.render("attendants", { title: "Attendants Monitoring" });
});

// Fetch attendants (JSON)
router.get("/attendants-data", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const attendants = await Attendant.find().sort({ name: 1 });
    res.json(attendants);
  } catch (err) {
    console.error("Error fetching attendants:", err);
    res.status(500).json({ error: "Failed to fetch attendants" });
  }
});

// Toggle attendant status (Active <-> Inactive)
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

// Serve Approve Stock page
router.get("/approve-stock", ensureauthenticated, ensureManager, (req, res) => {
  res.render("approve-stock", { title: "Approve Stock" });
});

// Fetch all stock submissions (JSON)
router.get("/stock-submissions", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const submissions = await stockSubmission.find()
      .populate("submittedBy", "name") // show attendant name
      .sort({ dateSubmitted: -1 })
      .lean();
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stock submissions" });
  }
});

// Approve a submission
router.post("/stock-submissions/:id/approve", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const submission = await stockSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    submission.status = "Approved";
    await submission.save();
    res.json({ message: "Stock approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error approving stock" });
  }
});

// Reject a submission
router.post("/stock-submissions/:id/reject", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const submission = await stockSubmission.findById(req.params.id); // fixed typo
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    submission.status = "Rejected";
    await submission.save();
    res.json({ message: "Stock rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error rejecting stock" });
  }
});

module.exports = router;
