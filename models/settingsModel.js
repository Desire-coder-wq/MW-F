const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  primaryColor: { type: String, default: "#0b880b" },
  secondaryColor: { type: String, default: "#3b82f6" },
  backgroundColor: { type: String, default: "#f8fafc" },
  themeMode: { type: String, default: "light" },
  fontSize: { type: String, default: "16px" },
  fontFamily: { type: String, default: "'Inter', sans-serif" },
  fontWeight: { type: String, default: "400" },
  companyName: { type: String, default: "Mayondo Wood & Furniture Ltd" },
  companyAddress: { type: String, default: "Mbarara, Uganda" },
  companyPhone: { type: String, default: "+254 700 000 000" },
  companyEmail: { type: String, default: "info@mwf.co.ug" },
  invoiceFormat: { type: String, default: "MWF-{year}-{sequence}" },
  transportFee: { type: Number, default: 5 },
  autoLogout: { type: String, default: "30" },
  dateFormat: { type: String, default: "DD/MM/YYYY" },
  language: { type: String, default: "en" },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Settings", settingsSchema);
