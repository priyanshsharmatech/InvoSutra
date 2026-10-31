const express = require("express");
const {
  getDashboardStats,
  getReport,
  getGstReport,
  getClientStatement,
} = require("../controllers/analyticsController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/dashboard", protect, getDashboardStats);
router.get("/report", protect, getReport);
router.get("/gst", protect, getGstReport);
router.get("/statement", protect, getClientStatement);

module.exports = router;
