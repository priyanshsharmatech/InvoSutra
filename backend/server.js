require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const env = require("./config/env");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const aiRoutes = require("./routes/aiRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const clientRoutes = require("./routes/clientRoutes");
const recurringRoutes = require("./routes/recurringRoutes");
const searchRoutes = require("./routes/searchRoutes");
const contactRoutes = require("./routes/contactRoutes");
const cron = require("node-cron");
const { runDueRecurring } = require("./utils/recurringRunner");
const { runDueReminders } = require("./utils/reminderRunner");
const { apiLimiter } = require("./middlewares/rateLimiters");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

const app = express();

// Secure HTTP headers
app.use(helmet());

// CORS — credentials enabled so the httpOnly refresh cookie flows.
// "*" can't be used with credentials, so reflect the request origin instead.
const allowedOrigins =
  env.CLIENT_ORIGIN === "*"
    ? true // reflect request origin
    : env.CLIENT_ORIGIN.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Connect Database
connectDB();

// Body + cookie parsers
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Basic global rate limiting
app.use("/api", apiLimiter);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/contact", contactRoutes);

// 404 + centralized error handling (must be last)
app.use(notFound);
app.use(errorHandler);

// Recurring invoice scheduler — run hourly, and once shortly after boot.
cron.schedule("0 * * * *", () => {
  runDueRecurring().catch((e) => console.error("Recurring run error:", e.message));
});
setTimeout(() => {
  runDueRecurring().catch((e) => console.error("Recurring run error:", e.message));
}, 10000);

// Overdue payment reminders — once a day at 9am (opt-in per user).
cron.schedule("0 9 * * *", () => {
  runDueReminders().catch((e) => console.error("Reminder run error:", e.message));
});

// Start Server
app.listen(env.PORT, () =>
  console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`)
);
