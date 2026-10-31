const express = require("express");
const {
  parseInvoiceFromText,
  parseReceiptFromImage,
  generateReminderEmail,
  getDashboardSummary,
} = require("../controllers/aiController");
const { protect } = require("../middlewares/authMiddleware.js");
const validate = require("../middlewares/validate.js");
const { aiLimiter } = require("../middlewares/rateLimiters.js");
const upload = require("../middlewares/upload.js");
const { parseTextSchema, reminderSchema } = require("../validators/aiValidators.js");

const router = express.Router();

router.post(
  "/parse-text",
  protect,
  aiLimiter,
  validate({ body: parseTextSchema }),
  parseInvoiceFromText
);
router.post(
  "/generate-reminder",
  protect,
  aiLimiter,
  validate({ body: reminderSchema }),
  generateReminderEmail
);
router.post(
  "/parse-receipt",
  protect,
  aiLimiter,
  upload.single("receipt"),
  parseReceiptFromImage
);
router.get("/dashboard-summary", protect, aiLimiter, getDashboardSummary);

module.exports = router;
