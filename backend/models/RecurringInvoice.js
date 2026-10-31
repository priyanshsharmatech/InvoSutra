const mongoose = require("mongoose");

// A template that auto-generates invoices on a schedule.
const recurringSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    billFrom: {
      businessName: String,
      email: String,
      address: String,
      phone: String,
    },
    billTo: {
      clientName: String,
      email: String,
      address: String,
      phone: String,
    },
    items: [
      {
        name: String,
        quantity: Number,
        unitPrice: Number,
        taxPercent: { type: Number, default: 0 },
      },
    ],
    notes: String,
    paymentTerms: { type: String, default: "Net 15" },
    theme: {
      type: String,
      enum: ["classic", "modern", "minimal", "corporate", "elegant", "bold", "compact"],
      default: "classic",
    },
    discount: {
      type: { type: String, enum: ["flat", "percent"], default: "flat" },
      value: { type: Number, default: 0 },
    },
    frequency: {
      type: String,
      enum: ["weekly", "monthly", "quarterly", "yearly"],
      required: true,
    },
    nextRun: { type: Date, required: true },
    lastRun: { type: Date },
    active: { type: Boolean, default: true },
    generatedCount: { type: Number, default: 0 },
    // Optional limits — stop when reached.
    endDate: { type: Date },
    maxOccurrences: { type: Number },
    // Email each generated invoice to the client automatically.
    autoEmail: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecurringInvoice", recurringSchema);
