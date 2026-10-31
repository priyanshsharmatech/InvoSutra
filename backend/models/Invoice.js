const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hsn: { type: String, default: "" }, // HSN/SAC code (GST)
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxPercent: { type: Number, default: 0 },
  // Per-line discount (flat ₹ or % of the line), applied before tax.
  discount: {
    type: { type: String, enum: ["flat", "percent"], default: "flat" },
    value: { type: Number, default: 0, min: 0 },
  },
  total: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    type: {
      type: String,
      enum: [
        "invoice",
        "estimate",
        "creditnote",
        "proforma",
        "debitnote",
        "receipt",
        "purchaseorder",
      ],
      default: "invoice",
    },
    relatedInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
    billFrom: {
      businessName: String,
      email: String,
      address: String,
      phone: String,
      gstin: String,
      state: String,
    },
    billTo: {
      clientName: String,
      email: String,
      address: String,
      phone: String,
      gstin: String,
      state: String,
    },
    items: [itemSchema],
    notes: {
      type: String,
    },
    paymentTerms: {
      type: String,
      default: "Net 15",
    },
    status: {
      type: String,
      // "Partially Paid" and "Overdue" are derived on the client; they are not
      // stored here. These are the manual/auto-settled states only.
      enum: ["Draft", "Sent", "Unpaid", "Paid", "Cancelled"],
      default: "Unpaid",
    },
    discount: {
      type: {
        type: String,
        enum: ["flat", "percent"],
        default: "flat",
      },
      value: { type: Number, default: 0, min: 0 },
    },
    subTotal: Number,
    taxTotal: Number,
    discountTotal: { type: Number, default: 0 },
    // Shipping / handling / other flat charges added to the total.
    additionalCharges: { type: Number, default: 0 },
    isInterState: { type: Boolean, default: false }, // GST: IGST vs CGST+SGST
    total: Number,
    payments: [
      {
        amount: { type: Number, required: true, min: 0 },
        date: { type: Date, default: Date.now },
        method: { type: String, default: "" },
        note: { type: String, default: "" },
      },
    ],
    amountPaid: { type: Number, default: 0 },
    // Uploaded supporting files (contracts, POs, etc.).
    attachments: [
      {
        name: { type: String, default: "" },
        url: { type: String, required: true },
        publicId: { type: String, default: "" },
        resourceType: { type: String, default: "image" },
        size: { type: Number, default: 0 },
        mimeType: { type: String, default: "" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    theme: {
      type: String,
      enum: ["classic", "modern", "minimal", "corporate", "elegant", "bold", "compact"],
      default: "classic",
    },
    // Marks a copy made via "Duplicate".
    isDuplicate: { type: Boolean, default: false },
    // When the invoice was last emailed to the client.
    lastSentAt: { type: Date },
    // Automated overdue-reminder tracking.
    lastReminderAt: { type: Date },
    reminderCount: { type: Number, default: 0 },
    // Soft delete — moved to Trash, recoverable until permanently removed.
    deleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Invoice numbers must be unique per user (not globally).
invoiceSchema.index({ user: 1, invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model("Invoice", invoiceSchema);
