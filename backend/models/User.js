// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      // Required only for email/password accounts; Google accounts have no password.
      required: function () {
        return !this.googleId;
      },
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      index: true,
    },
    businessName: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    gstin: { type: String, default: "" },
    state: { type: String, default: "" },
    invoicePrefix: { type: String, default: "INV" },
    // Optional per-document-type number prefixes; fall back to built-in
    // defaults (EST/CRN/PRO/DBN/RCP/PO) and invoicePrefix when unset.
    docPrefixes: {
      invoice: { type: String, default: "" },
      estimate: { type: String, default: "" },
      creditnote: { type: String, default: "" },
      proforma: { type: String, default: "" },
      debitnote: { type: String, default: "" },
      receipt: { type: String, default: "" },
      purchaseorder: { type: String, default: "" },
    },

    // Brand assets (stored in Cloudinary) rendered on invoices.
    brandLogo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    signature: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    stamp: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    // Default invoice theme for new invoices.
    invoiceTheme: {
      type: String,
      enum: ["classic", "modern", "minimal", "corporate", "elegant", "bold", "compact"],
      default: "classic",
    },
    // Defaults pre-filled into new invoices.
    // Opt-in: automatically email overdue-payment reminders to clients.
    autoReminders: { type: Boolean, default: false },
    defaultNotes: { type: String, default: "" },
    defaultPaymentTerms: { type: String, default: "Net 15" },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

//Password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//Method to compare password
userSchema.methods.matchPassword = async function (enterPassword) {
  return await bcrypt.compare(enterPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
