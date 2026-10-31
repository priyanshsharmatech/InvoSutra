const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const asyncHandler = require("../utils/asyncHandler");

// Build an ordered list of the last N month buckets (oldest -> newest).
const lastNMonths = (n) => {
  const buckets = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1, // 1-indexed to match $month
      label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
      total: 0,
    });
  }
  return buckets;
};

// @desc    Aggregated dashboard analytics for the logged-in user
// @route   GET /api/analytics/dashboard
// @access  Private
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();

  // Cash actually received on a document: full total once Paid, else amountPaid.
  const received = {
    $cond: [
      { $eq: ["$status", "Paid"] },
      "$total",
      { $ifNull: ["$amountPaid", 0] },
    ],
  };
  // Balance still owed (only meaningful for open docs).
  const balance = { $subtract: ["$total", { $ifNull: ["$amountPaid", 0] }] };
  const isOpen = { $in: ["$status", ["Unpaid", "Sent"]] };

  const [facet] = await Invoice.aggregate([
    { $match: { user: userId, type: "invoice", deleted: { $ne: true } } },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalInvoices: { $sum: 1 },
              paidCount: {
                $sum: { $cond: [{ $eq: ["$status", "Paid"] }, 1, 0] },
              },
              unpaidCount: { $sum: { $cond: [isOpen, 1, 0] } },
              totalRevenue: { $sum: received },
              totalOutstanding: { $sum: { $cond: [isOpen, balance, 0] } },
            },
          },
        ],
        statusBreakdown: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ],
        monthlyRevenue: [
          {
            $group: {
              _id: {
                year: { $year: "$invoiceDate" },
                month: { $month: "$invoiceDate" },
              },
              total: { $sum: received },
            },
          },
        ],
        overdue: [
          {
            $match: {
              status: { $in: ["Unpaid", "Sent"] },
              dueDate: { $lt: now },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              amount: { $sum: balance },
            },
          },
        ],
        unpaidList: [
          { $match: { status: { $in: ["Unpaid", "Sent"] } } },
          { $project: { total: 1, amountPaid: 1, dueDate: 1 } },
        ],
        topClients: [
          {
            $group: {
              _id: "$billTo.clientName",
              total: { $sum: "$total" },
              count: { $sum: 1 },
            },
          },
          { $match: { _id: { $nin: [null, ""] } } },
          { $sort: { total: -1 } },
          { $limit: 5 },
        ],
      },
    },
  ]);

  // Build aging buckets (days overdue) for unpaid invoices.
  const aging = {
    current: { count: 0, amount: 0 },
    d1_30: { count: 0, amount: 0 },
    d31_60: { count: 0, amount: 0 },
    d60plus: { count: 0, amount: 0 },
  };
  const DAY = 24 * 60 * 60 * 1000;
  (facet.unpaidList || []).forEach((inv) => {
    const amt = Math.max((inv.total || 0) - (inv.amountPaid || 0), 0);
    const overdueDays = inv.dueDate
      ? Math.floor((now - new Date(inv.dueDate)) / DAY)
      : 0;
    let bucket;
    if (overdueDays <= 0) bucket = aging.current;
    else if (overdueDays <= 30) bucket = aging.d1_30;
    else if (overdueDays <= 60) bucket = aging.d31_60;
    else bucket = aging.d60plus;
    bucket.count += 1;
    bucket.amount += amt;
  });

  const summary = facet.summary[0] || {
    totalInvoices: 0,
    paidCount: 0,
    unpaidCount: 0,
    totalRevenue: 0,
    totalOutstanding: 0,
  };

  const overdue = facet.overdue[0] || { count: 0, amount: 0 };

  // Fold the DB monthly buckets into a fixed last-6-months series.
  const months = lastNMonths(6);
  const monthMap = new Map(
    facet.monthlyRevenue.map((m) => [`${m._id.year}-${m._id.month}`, m.total])
  );
  months.forEach((bucket) => {
    const key = `${bucket.year}-${bucket.month}`;
    if (monthMap.has(key)) bucket.total = monthMap.get(key);
  });

  res.json({
    summary: {
      totalInvoices: summary.totalInvoices,
      paidCount: summary.paidCount,
      unpaidCount: summary.unpaidCount,
      totalRevenue: summary.totalRevenue,
      totalOutstanding: summary.totalOutstanding,
      overdueCount: overdue.count,
      overdueAmount: overdue.amount,
    },
    statusBreakdown: (facet.statusBreakdown || [])
      .filter((s) => s._id)
      .map((s) => ({ status: s._id, count: s.count })),
    monthlyRevenue: months.map(({ label, total }) => ({ label, total })),
    aging,
    topClients: (facet.topClients || []).map((c) => ({
      name: c._id,
      total: c.total,
      count: c.count,
    })),
  });
});

// @desc    Date-range report (invoices only)
// @route   GET /api/analytics/report?from=&to=
// @access  Private
exports.getReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { user: req.user._id, type: "invoice" };
  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    dateFilter.$lte = d;
  }
  if (Object.keys(dateFilter).length) match.invoiceDate = dateFilter;

  const rows = await Invoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        amount: { $sum: "$total" },
        // Cash actually received: full total for Paid, else amountPaid so far.
        received: {
          $sum: {
            $cond: [
              { $eq: ["$status", "Paid"] },
              "$total",
              { $ifNull: ["$amountPaid", 0] },
            ],
          },
        },
      },
    },
  ]);

  const byStatus = {};
  rows.forEach((r) => {
    byStatus[r._id] = { count: r.count, amount: r.amount, received: r.received };
  });

  // Issued invoices exclude Draft (not sent) and Cancelled (voided).
  const issued = rows.filter(
    (r) => r._id !== "Draft" && r._id !== "Cancelled"
  );
  const totalInvoiced = issued.reduce((s, r) => s + r.amount, 0);
  const paid = issued.reduce((s, r) => s + (r.received || 0), 0);
  const outstanding = Math.max(totalInvoiced - paid, 0);
  const count = issued.reduce((s, r) => s + r.count, 0);

  res.json({
    from: from || null,
    to: to || null,
    byStatus,
    totalInvoiced,
    paid,
    outstanding,
    count,
  });
});

// Date-range filter helper.
const dateMatch = (from, to) => {
  const m = {};
  if (from) m.$gte = new Date(from);
  if (to) {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    m.$lte = d;
  }
  return Object.keys(m).length ? m : null;
};

// @desc    GST summary (GSTR-style) over a date range
// @route   GET /api/analytics/gst?from=&to=
// @access  Private
exports.getGstReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = {
    user: req.user._id,
    type: "invoice",
    deleted: { $ne: true },
    status: { $nin: ["Draft", "Cancelled"] },
  };
  const df = dateMatch(from, to);
  if (df) match.invoiceDate = df;

  const invoices = await Invoice.find(match)
    .select(
      "invoiceNumber invoiceDate billTo.clientName billTo.gstin subTotal discountTotal taxTotal total isInterState"
    )
    .sort({ invoiceDate: 1 });

  const rows = invoices.map((inv) => {
    const taxable = Math.max((inv.subTotal || 0) - (inv.discountTotal || 0), 0);
    const tax = inv.taxTotal || 0;
    const igst = inv.isInterState ? tax : 0;
    const cgst = inv.isInterState ? 0 : tax / 2;
    const sgst = inv.isInterState ? 0 : tax / 2;
    return {
      invoiceNumber: inv.invoiceNumber,
      date: inv.invoiceDate,
      clientName: inv.billTo?.clientName || "",
      gstin: inv.billTo?.gstin || "",
      taxable,
      cgst,
      sgst,
      igst,
      total: inv.total || 0,
    };
  });

  const sum = (k) => rows.reduce((s, r) => s + r[k], 0);
  res.json({
    from: from || null,
    to: to || null,
    rows,
    summary: {
      count: rows.length,
      taxable: sum("taxable"),
      cgst: sum("cgst"),
      sgst: sum("sgst"),
      igst: sum("igst"),
      totalTax: sum("cgst") + sum("sgst") + sum("igst"),
      total: sum("total"),
    },
  });
});

// @desc    Per-client statement (ledger of invoices + payments)
// @route   GET /api/analytics/statement?client=&from=&to=
// @access  Private
exports.getClientStatement = asyncHandler(async (req, res) => {
  const { client, from, to } = req.query;
  if (!client) {
    return res.json({ client: "", rows: [], summary: {} });
  }
  const match = {
    user: req.user._id,
    type: "invoice",
    deleted: { $ne: true },
    "billTo.clientName": client,
  };
  const df = dateMatch(from, to);
  if (df) match.invoiceDate = df;

  const invoices = await Invoice.find(match)
    .select("invoiceNumber invoiceDate dueDate status total amountPaid payments")
    .sort({ invoiceDate: 1 });

  let totalBilled = 0;
  let totalPaid = 0;
  const rows = invoices.map((inv) => {
    const billed = inv.total || 0;
    const paid = inv.amountPaid || 0;
    totalBilled += billed;
    totalPaid += paid;
    return {
      _id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      date: inv.invoiceDate,
      dueDate: inv.dueDate,
      status: inv.status,
      billed,
      paid,
      balance: Math.max(billed - paid, 0),
    };
  });

  res.json({
    client,
    from: from || null,
    to: to || null,
    rows,
    summary: {
      count: rows.length,
      totalBilled,
      totalPaid,
      balance: Math.max(totalBilled - totalPaid, 0),
    },
  });
});
