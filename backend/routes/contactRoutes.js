const express = require("express");
const { z } = require("zod");
const { submitContact } = require("../controllers/contactController");
const validate = require("../middlewares/validate");
const { authLimiter } = require("../middlewares/rateLimiters");

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.email("A valid email is required"),
  message: z.string().trim().min(5, "Message is too short").max(5000),
});

const router = express.Router();

// Public, rate-limited to curb abuse.
router.post("/", authLimiter, validate({ body: contactSchema }), submitContact);

module.exports = router;
