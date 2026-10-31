const mongoose = require("mongoose");

// Records privileged admin actions for accountability.
const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorEmail: { type: String }, // denormalized for easy display
    action: { type: String, required: true }, // e.g. "user.suspend"
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    targetEmail: { type: String },
    details: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
