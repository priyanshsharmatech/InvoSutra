const Invoice = require("../models/Invoice");
const Client = require("../models/Client");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Global search across invoices and clients
// @route   GET /api/search?q=
// @access  Private
exports.search = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 2) return res.json({ invoices: [], clients: [] });

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const [invoices, clients] = await Promise.all([
    Invoice.find({
      user: req.user.id,
      deleted: { $ne: true },
      $or: [
        { invoiceNumber: regex },
        { "billTo.clientName": regex },
        { "billTo.email": regex },
      ],
    })
      .select("invoiceNumber billTo.clientName total status type")
      .sort({ createdAt: -1 })
      .limit(6),
    Client.find({
      user: req.user.id,
      $or: [{ clientName: regex }, { email: regex }],
    })
      .select("clientName email")
      .limit(5),
  ]);

  res.json({ invoices, clients });
});
