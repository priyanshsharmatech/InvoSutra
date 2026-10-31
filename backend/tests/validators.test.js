const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createInvoiceSchema,
  listQuerySchema,
} = require("../validators/invoiceValidators");
const { createClientSchema } = require("../validators/clientValidators");

const baseInvoice = () => ({
  billTo: { clientName: "Acme" },
  items: [{ name: "Work", quantity: 2, unitPrice: 100, taxPercent: 18 }],
});

/* -------------------------- createInvoiceSchema -------------------------- */

test("createInvoiceSchema: a minimal valid invoice passes", () => {
  const r = createInvoiceSchema.safeParse(baseInvoice());
  assert.ok(r.success, JSON.stringify(r.error?.issues));
});

test("createInvoiceSchema: requires at least one item", () => {
  const r = createInvoiceSchema.safeParse({ ...baseInvoice(), items: [] });
  assert.equal(r.success, false);
});

test("createInvoiceSchema: item quantity must be positive", () => {
  const r = createInvoiceSchema.safeParse({
    ...baseInvoice(),
    items: [{ name: "x", quantity: 0, unitPrice: 10 }],
  });
  assert.equal(r.success, false);
});

test("createInvoiceSchema: coerces numeric strings on items", () => {
  const r = createInvoiceSchema.safeParse({
    ...baseInvoice(),
    items: [{ name: "x", quantity: "3", unitPrice: "50", taxPercent: "5" }],
  });
  assert.ok(r.success);
  assert.equal(r.data.items[0].quantity, 3);
  assert.equal(r.data.items[0].unitPrice, 50);
});

test("createInvoiceSchema: accepts a per-line discount object", () => {
  const r = createInvoiceSchema.safeParse({
    ...baseInvoice(),
    items: [
      { name: "x", quantity: 1, unitPrice: 100, discount: { type: "percent", value: 10 } },
    ],
  });
  assert.ok(r.success, JSON.stringify(r.error?.issues));
});

test("createInvoiceSchema: rejects an unknown status", () => {
  const r = createInvoiceSchema.safeParse({ ...baseInvoice(), status: "Bogus" });
  assert.equal(r.success, false);
});

test("createInvoiceSchema: accepts a valid status and type", () => {
  const r = createInvoiceSchema.safeParse({
    ...baseInvoice(),
    status: "Sent",
    type: "estimate",
  });
  assert.ok(r.success, JSON.stringify(r.error?.issues));
});

test("createInvoiceSchema: rejects a negative additionalCharges", () => {
  const r = createInvoiceSchema.safeParse({ ...baseInvoice(), additionalCharges: -5 });
  assert.equal(r.success, false);
});

/* ---------------------------- listQuerySchema ---------------------------- */

test("listQuerySchema: applies defaults for page/limit", () => {
  const r = listQuerySchema.safeParse({});
  assert.ok(r.success);
  assert.equal(r.data.page, 1);
  assert.equal(r.data.limit, 10);
});

test("listQuerySchema: accepts derived status filters", () => {
  for (const s of ["Overdue", "Partially Paid", "Cancelled"]) {
    const r = listQuerySchema.safeParse({ status: s });
    assert.ok(r.success, `status ${s} should be valid`);
  }
});

/* --------------------------- createClientSchema -------------------------- */

test("createClientSchema: requires a client name", () => {
  assert.equal(createClientSchema.safeParse({}).success, false);
  assert.ok(createClientSchema.safeParse({ clientName: "Acme" }).success);
});

test("createClientSchema: empty email string is allowed, bad email rejected", () => {
  assert.ok(createClientSchema.safeParse({ clientName: "A", email: "" }).success);
  assert.equal(
    createClientSchema.safeParse({ clientName: "A", email: "not-an-email" }).success,
    false
  );
});
