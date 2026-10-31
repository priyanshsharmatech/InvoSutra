const Invoice = require("../models/Invoice");

// Round a monetary value to 2 decimal places (paise), avoiding float noise.
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Discount amount for a single line (flat ₹ or % of the gross line), capped.
const lineDiscount = (gross, discount) => {
  if (!discount || !discount.value) return 0;
  const amt =
    discount.type === "percent"
      ? (gross * discount.value) / 100
      : discount.value;
  return Math.min(Math.max(amt, 0), gross);
};

// Compute each item's line total plus invoice subTotal / taxTotal. Per-line
// discounts are applied before tax; subTotal is the net (post-line-discount)
// taxable base. All money is rounded to 2 decimals.
const computeTotals = (items) => {
  let subTotal = 0;
  let taxTotal = 0;
  const itemsWithTotals = (items || []).map((item) => {
    const gross = (item.unitPrice || 0) * (item.quantity || 0);
    const disc = lineDiscount(gross, item.discount);
    const net = round2(gross - disc);
    const tax = round2((net * (item.taxPercent || 0)) / 100);
    subTotal += net;
    taxTotal += tax;
    return {
      ...(item.toObject ? item.toObject() : item),
      total: round2(net + tax),
    };
  });
  return { items: itemsWithTotals, subTotal: round2(subTotal), taxTotal: round2(taxTotal) };
};

const computeDiscount = (subTotal, discount) => {
  if (!discount || !discount.value) return 0;
  const amount =
    discount.type === "percent"
      ? (subTotal * discount.value) / 100
      : discount.value;
  return round2(Math.min(Math.max(amount, 0), subTotal));
};

// The document types InvoSutra supports.
const DOCUMENT_TYPES = [
  "invoice",
  "estimate",
  "creditnote",
  "proforma",
  "debitnote",
  "receipt",
  "purchaseorder",
];

// Prefix per document type. Invoices use the user's custom prefix.
const TYPE_PREFIX = {
  estimate: "QTN",
  creditnote: "CRN",
  proforma: "PRO",
  debitnote: "DBN",
  receipt: "RCP",
  purchaseorder: "PO",
};
// `overrides` is the user's optional docPrefixes map (per type). When a type
// has a non-empty override, it wins; otherwise fall back to the built-in
// prefix, the user's invoice prefix, or "INV".
const prefixFor = (type, userPrefix, overrides) => {
  const override = overrides?.[type];
  if (override && String(override).trim()) return String(override).trim();
  return TYPE_PREFIX[type] || userPrefix || "INV";
};

const formatNumber = (prefix, n) => `${prefix}-${String(n).padStart(3, "0")}`;

// Next sequential number for a user's documents of a given type.
const computeNextNumber = async (userId, type = "invoice") => {
  const docs = await Invoice.find({ user: userId, type }).select(
    "invoiceNumber -_id"
  );
  let max = 0;
  docs.forEach((d) => {
    // Ignore duplicate copies like "INV-003 (Copy 2)" so they don't skew the
    // running sequence — strip the trailing "(Copy ...)" before parsing.
    const base = String(d.invoiceNumber).replace(/\s*\(copy[^)]*\)\s*$/i, "");
    const m = base.match(/(\d+)\s*$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
  });
  return max + 1;
};

module.exports = {
  round2,
  computeTotals,
  computeDiscount,
  formatNumber,
  computeNextNumber,
  prefixFor,
  DOCUMENT_TYPES,
};
