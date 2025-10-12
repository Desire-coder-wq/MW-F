// routes/attendantRoutes.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const Supplier = require("../models/supplierModel");
const Attendant = require("../models/attendantModel");
const StockSubmission = require("../models/stockSubmission");
const Stock = require("../models/stockModel");
const Task = require("../models/taskModel");
const { ensureauthenticated, ensureManager, ensureAgent } = require("../middleware/auth");

// ==================== NOTIFICATION MANAGER ====================
const NotificationManager = require("../utils/notifications");

// ==================== MULTER CONFIG ====================

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ==================== ATTENDANTS ====================

// GET: All attendants (Manager)
router.get("/attendants", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const attendants = await Attendant.find()
      .populate("user", "name email")
      .sort({ "user.name": 1 })
      .lean();

    res.render("attendants", {
      title: "Attendants Monitoring",
      attendants,
      message: req.query.message,
      error: req.query.error,
    });
  } catch (err) {
    console.error(" Error fetching attendants:", err);
    res.status(500).send("Failed to fetch attendants");
  }
});

// POST: Toggle attendant status
router.post("/attendants/:id/toggle", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const attendant = await Attendant.findById(req.params.id);
    if (!attendant) return res.status(404).json({ error: "Attendant not found" });

    attendant.status = attendant.status === "Active" ? "Inactive" : "Active";
    attendant.lastActive = new Date();
    await attendant.save();

    res.json({ message: "Status updated", attendant });
  } catch (err) {
    console.error(" Error updating attendant status:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// ==================== TASK ASSIGNMENT ====================

// POST: Assign new task to an attendant
router.post("/attendants/assign-task", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const { attendantId, taskType, taskDescription, dueDate, priority } = req.body;

    const attendant = await Attendant.findById(attendantId).populate("user");
    if (!attendant) return res.redirect("/attendants?error=Attendant not found");

    const newTask = new Task({
      attendantId,
      attendantName: attendant.user.name,
      attendantEmail: attendant.user.email,
      taskType,
      taskDescription,
      priority,
      dueDate,
      assignedBy: req.session.user.name,
    });

    await newTask.save();

    attendant.assignedTask = `${taskType}: ${taskDescription}`;
    attendant.lastTaskUpdate = new Date();
    await attendant.save();

    res.redirect("/attendants?message=Task assigned successfully");
  } catch (err) {
    console.error(" Error assigning task:", err);
    res.redirect("/attendants?error=Task assignment failed");
  }
});

// ==================== ATTENDANT TASKS ====================

// GET: Attendant's own tasks
router.get("/attendant/tasks", ensureauthenticated, ensureAgent, async (req, res) => {
  try {
    const attendant = await Attendant.findOne({ user: req.session.user._id });
    if (!attendant)
      return res.render("attendant-tasks", {
        title: "My Tasks",
        tasks: [],
        error: "Profile not found",
      });

    const tasks = await Task.find({ attendantId: attendant._id }).sort({ dueDate: 1 }).lean();

    res.render("attendant-tasks", {
      title: "My Tasks",
      tasks,
      message: req.query.message,
      error: req.query.error,
    });
  } catch (err) {
    console.error(" Error loading attendant tasks:", err);
    res.status(500).send("Error loading tasks");
  }
});

// POST: Update task status (attendant marks task as completed)
router.post("/attendant/tasks/:id/complete", ensureauthenticated, ensureAgent, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Verify the task belongs to the current attendant
    const attendant = await Attendant.findOne({ user: req.session.user._id });
    if (!attendant || task.attendantId.toString() !== attendant._id.toString()) {
      return res.status(403).json({ error: "Not authorized to update this task" });
    }

    // Update task status
    task.status = "Completed";
    task.completedAt = new Date();
    await task.save();

    // Notify manager that task is completed
    try {
      await NotificationManager.notifyTaskCompletion(
        task._id,
        req.session.user._id,
        req.session.user.name,
        task.taskType,
        task.taskDescription
      );
      console.log(" Task completion notification sent to manager");
    } catch (notifyError) {
      console.error("Error sending task completion notification:", notifyError);
      // Don't fail the request if notification fails
    }

    res.json({ 
      success: true,
      message: "Task marked as completed", 
      task: {
        _id: task._id,
        status: task.status,
        completedAt: task.completedAt
      }
    });
  } catch (err) {
    console.error(" Error completing task:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to update task" 
    });
  }
});

// POST: Update task status to In Progress (start task)
router.post("/attendant/tasks/:id/start", ensureauthenticated, ensureAgent, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Verify the task belongs to the current attendant
    const attendant = await Attendant.findOne({ user: req.session.user._id });
    if (!attendant || task.attendantId.toString() !== attendant._id.toString()) {
      return res.status(403).json({ error: "Not authorized to update this task" });
    }

    // Update task status to In Progress
    task.status = "In Progress";
    await task.save();

    res.json({ 
      success: true,
      message: "Task started successfully", 
      task: {
        _id: task._id,
        status: task.status
      }
    });
  } catch (err) {
    console.error(" Error starting task:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to start task" 
    });
  }
});
// ==================== STOCK SUBMISSION ====================

// GET: Render stock submission form
router.get("/attendant/add-stock", ensureauthenticated, ensureAgent, async (req, res) => {
  try {
    const suppliers = await Supplier.find().lean();
    res.render("attendant-add-stock", {
      title: "Submit Stock",
      suppliers,
      message: req.query.message,
      error: req.query.error,
    });
  } catch (err) {
    console.error("Error loading stock form:", err);
    res.status(500).send("Error loading stock form");
  }
});

// POST: Submit stock (with sellingPrice)
router.post(
  "/attendant/add-stock",
  ensureauthenticated,
  ensureAgent,
  upload.single("image"),
  async (req, res) => {
    try {
      const { productName, quantity, costPrice, sellingPrice, supplier } = req.body;
      if (!productName || !quantity || !costPrice || !sellingPrice || !supplier) {
        const suppliers = await Supplier.find().lean();
        return res.render("attendant-add-stock", {
          title: "Submit Stock",
          suppliers,
          error: "Product name, quantity, cost price, selling price, and supplier are required",
        });
      }

      const imagePath = req.file ? `/uploads/${req.file.filename}` : "";

      const submission = new StockSubmission({
        productName,
        productType: req.body.productType,
        category: req.body.category,
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice), // <--- added
        quantity: parseInt(quantity),
        supplier,
        supplierEmail: req.body.supplierEmail,
        supplierContact: req.body.supplierContact,
        supplierAddress: req.body.supplierAddress,
        date: req.body.date || new Date(),
        quality: req.body.quality,
        color: req.body.color,
        measurement: req.body.measurement,
        image: imagePath,
        submittedBy: req.session.user._id,
        status: "Pending",
      });

      await submission.save();
      console.log(" Stock submission saved:", submission._id);

      // ==================== NOTIFICATION: Stock requires approval ====================
      try {
        await NotificationManager.notifyStockAddition(
          submission._id,
          req.session.user._id,
          req.session.user.name,
          productName,
          quantity
        );
        console.log(" Stock approval notification sent to manager");
      } catch (notifyError) {
        console.error("Error sending stock approval notification:", notifyError);
        // Don't fail the request if notification fails
      }

      // Auto-save supplier if not exists
      if (supplier && supplier.trim() !== "") {
        const supplierName = supplier.trim();
        const existingSupplier = await Supplier.findOne({
          name: { $regex: new RegExp(`^${supplierName}$`, "i") },
        });

        if (!existingSupplier) {
          const newSupplier = new Supplier({
            name: supplierName,
            email: req.body.supplierEmail || "",
            contact: req.body.supplierContact || "",
            address: req.body.supplierAddress || "",
            addedBy: req.session.user._id,
          });
          await newSupplier.save();
        }
      }

      res.redirect("/attendant-dashboard?message=Stock submitted successfully");
    } catch (err) {
      console.error("Error submitting stock:", err);
      const suppliers = await Supplier.find().lean();
      res.render("attendant-add-stock", {
        title: "Submit Stock",
        suppliers,
        error: "Error submitting stock: " + err.message,
      });
    }
  }
);

// ==================== STOCK APPROVAL ====================

// GET: View stock submissions
router.get("/approve-stock", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const submissions = await StockSubmission.find()
      .populate("submittedBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.render("approve-stock", {
      title: "Approve Stock",
      submissions,
      message: req.query.message,
      error: req.query.error,
    });
  } catch (err) {
    console.error(" Error fetching stock submissions:", err);
    res.status(500).send("Error fetching submissions");
  }
});

// POST: Approve stock
router.post("/stock-submissions/:id/approve", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const submission = await StockSubmission.findById(req.params.id);
    if (!submission) return res.status(404).send("Submission not found");

    submission.status = "Approved";
    submission.approvedBy = req.session.user._id;
    submission.approvedAt = new Date();
    await submission.save();

    // Save approved stock to main collection
    const newStock = new Stock({
      productName: submission.productName,
      productType: submission.productType,
      category: submission.category,
      costPrice: submission.costPrice,
      sellingPrice: submission.sellingPrice, // <--- added
      quantity: submission.quantity,
      supplier: submission.supplier,
      supplierEmail: submission.supplierEmail,
      supplierContact: submission.supplierContact,
      supplierAddress: submission.supplierAddress,
      quality: submission.quality,
      color: submission.color,
      measurement: submission.measurement,
      date: new Date(),
      image: submission.image,
      addedBy: submission.submittedBy,
      approvedBy: req.session.user._id,
    });

    await newStock.save();
    console.log(" Stock approved & added to main collection");

    // ==================== NOTIFICATION: Stock approved ====================
    try {
      await NotificationManager.notifyStockApproval(
        submission._id,
        req.session.user._id,
        req.session.user.name,
        submission.productName,
        submission.quantity
      );
      console.log(" Stock approval notification sent");
    } catch (notifyError) {
      console.error("Error sending stock approval notification:", notifyError);
      // Don't fail the request if notification fails
    }

    res.redirect("/approve-stock?message=Stock approved successfully");
  } catch (err) {
    console.error(" Error approving stock:", err);
    res.redirect("/approve-stock?error=Error approving stock");
  }
});

// POST: Reject stock
router.post("/stock-submissions/:id/reject", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const submission = await StockSubmission.findById(req.params.id);
    if (!submission) return res.status(404).send("Submission not found");

    submission.status = "Rejected";
    submission.rejectedBy = req.session.user._id;
    submission.rejectedAt = new Date();
    await submission.save();

    // ==================== NOTIFICATION: Stock rejected ====================
    try {
      await NotificationManager.notifyStockRejection(
        submission._id,
        req.session.user._id,
        req.session.user.name,
        submission.productName,
        submission.quantity
      );
      console.log(" Stock rejection notification sent");
    } catch (notifyError) {
      console.error("Error sending stock rejection notification:", notifyError);
      // Don't fail the request if notification fails
    }

    res.redirect("/approve-stock?message=Stock rejected");
  } catch (err) {
    console.error("Error rejecting stock:", err);
    res.redirect("/approve-stock?error=Error rejecting stock");
  }
});

// ==================== TASK REPORTS ====================
router.get("/task-reports", ensureauthenticated, ensureManager, async (req, res) => {
  try {
    const tasks = await Task.find().sort({ assignedAt: -1 }).lean();

    res.render("task-reports", {
      title: "Task Reports - MWF",
      tasks,
      message: req.query.message || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error(" Error fetching task reports:", err);
    res.status(500).send("Error fetching task reports");
  }
});

module.exports = router;