const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clientName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    gstin: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    // Per-client defaults applied when this client is picked on a new invoice.
    defaultPaymentTerms: { type: String, default: "" },
    defaultNotes: { type: String, default: "" },
    deleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
