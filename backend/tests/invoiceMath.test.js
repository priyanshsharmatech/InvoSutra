const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  computeTotals,
  computeDiscount,
  formatNumber,
  prefixFor,
  DOCUMENT_TYPES,
} = require("../utils/invoiceMath");

const approx = (a, b, msg) => assert.ok(Math.abs(a - b) < 0.001, `${msg} (got ${a}, want ${b})`);

/* ----------------------------- computeTotals ----------------------------- */

test("computeTotals: basic line with no tax/discount", () => {
  const r = computeTotals([{ quantity: 3, unitPrice: 100 }]);
  assert.equal(r.subTotal, 300);
  assert.equal(r.taxTotal, 0);
  assert.equal(r.items[0].total, 300);
});

test("computeTotals: tax applied on the line", () => {
  const r = computeTotals([{ quantity: 2, unitPrice: 1000, taxPercent: 18 }]);
  assert.equal(r.subTotal, 2000);
  assert.equal(r.taxTotal, 360);
  assert.equal(r.items[0].total, 2360);
});

test("computeTotals: per-line percent discount is applied before tax", () => {
  const r = computeTotals([
    { quantity: 2, unitPrice: 1000, taxPercent: 18, discount: { type: "percent", value: 10 } },
  ]);
  assert.equal(r.subTotal, 1800); // 2000 - 10%
  assert.equal(r.taxTotal, 324); // 18% of 1800
  assert.equal(r.items[0].total, 2124);
});

test("computeTotals: per-line flat discount is applied before tax", () => {
  const r = computeTotals([
    { quantity: 1, unitPrice: 500, taxPercent: 18, discount: { type: "flat", value: 100 } },
  ]);
  assert.equal(r.subTotal, 400);
  assert.equal(r.taxTotal, 72);
  assert.equal(r.items[0].total, 472);
});

test("computeTotals: a line discount larger than the line is capped (never negative)", () => {
  const r = computeTotals([
    { quantity: 1, unitPrice: 100, taxPercent: 18, discount: { type: "flat", value: 500 } },
  ]);
  assert.equal(r.subTotal, 0);
  assert.equal(r.taxTotal, 0);
  assert.equal(r.items[0].total, 0);
});

test("computeTotals: aggregates multiple lines", () => {
  const r = computeTotals([
    { quantity: 2, unitPrice: 1000, taxPercent: 18, discount: { type: "percent", value: 10 } },
    { quantity: 1, unitPrice: 500, taxPercent: 18, discount: { type: "flat", value: 100 } },
  ]);
  assert.equal(r.subTotal, 2200); // 1800 + 400
  assert.equal(r.taxTotal, 396); // 324 + 72
});

test("computeTotals: missing quantity/price treated as 0", () => {
  const r = computeTotals([{ name: "x" }]);
  assert.equal(r.subTotal, 0);
  assert.equal(r.items[0].total, 0);
});

test("computeTotals: empty/undefined items", () => {
  assert.equal(computeTotals([]).subTotal, 0);
  assert.equal(computeTotals(undefined).subTotal, 0);
});

/* ---------------------------- computeDiscount ---------------------------- */

test("computeDiscount: flat amount", () => {
  assert.equal(computeDiscount(1000, { type: "flat", value: 150 }), 150);
});

test("computeDiscount: percent of subtotal", () => {
  assert.equal(computeDiscount(1000, { type: "percent", value: 10 }), 100);
});

test("computeDiscount: capped at subtotal", () => {
  assert.equal(computeDiscount(100, { type: "percent", value: 150 }), 100);
  assert.equal(computeDiscount(100, { type: "flat", value: 500 }), 100);
});

test("computeDiscount: no discount → 0", () => {
  assert.equal(computeDiscount(1000, undefined), 0);
  assert.equal(computeDiscount(1000, { type: "flat", value: 0 }), 0);
});

/* ------------------------------- prefixFor ------------------------------- */

test("prefixFor: built-in type prefixes", () => {
  assert.equal(prefixFor("estimate"), "QTN");
  assert.equal(prefixFor("creditnote"), "CRN");
  assert.equal(prefixFor("proforma"), "PRO");
  assert.equal(prefixFor("debitnote"), "DBN");
  assert.equal(prefixFor("receipt"), "RCP");
  assert.equal(prefixFor("purchaseorder"), "PO");
});

test("prefixFor: invoice uses the user prefix or defaults to INV", () => {
  assert.equal(prefixFor("invoice"), "INV");
  assert.equal(prefixFor("invoice", "ACME"), "ACME");
});

test("prefixFor: per-type override wins", () => {
  assert.equal(prefixFor("estimate", "INV", { estimate: "QT" }), "QT");
  assert.equal(prefixFor("invoice", "INV", { invoice: "BILL" }), "BILL");
});

test("prefixFor: blank override falls back to the built-in", () => {
  assert.equal(prefixFor("estimate", "INV", { estimate: "   " }), "QTN");
  assert.equal(prefixFor("estimate", "INV", {}), "QTN");
});

/* ------------------------------ formatNumber ----------------------------- */

test("formatNumber: pads to 3 digits", () => {
  assert.equal(formatNumber("INV", 1), "INV-001");
  assert.equal(formatNumber("QTN", 42), "QTN-042");
  assert.equal(formatNumber("INV", 1234), "INV-1234");
});

/* --------------------- edge cases / behaviour probes --------------------- */

test("computeTotals: money is rounded to 2 decimals", () => {
  const r = computeTotals([{ quantity: 3, unitPrice: 99.99, taxPercent: 18 }]);
  assert.equal(r.subTotal, 299.97);
  assert.equal(r.taxTotal, 53.99); // 53.9946 → 53.99
  assert.equal(r.items[0].total, 353.96);
});

test("computeTotals: percent line discount result is rounded", () => {
  const r = computeTotals([
    { quantity: 1, unitPrice: 999, taxPercent: 0, discount: { type: "percent", value: 7.5 } },
  ]);
  assert.equal(r.subTotal, 924.08); // 999 - 7.5% = 924.075 → 924.08
});

/* ----------------------------- DOCUMENT_TYPES ---------------------------- */

test("DOCUMENT_TYPES: contains all supported types", () => {
  for (const t of [
    "invoice",
    "estimate",
    "creditnote",
    "proforma",
    "debitnote",
    "receipt",
    "purchaseorder",
  ]) {
    assert.ok(DOCUMENT_TYPES.includes(t), `missing ${t}`);
  }
});
