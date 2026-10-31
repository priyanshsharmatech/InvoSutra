const Invoice = require("../models/Invoice");
const RecurringInvoice = require("../models/RecurringInvoice");
const User = require("../models/User");
const {
  computeTotals,
  computeDiscount,
  formatNumber,
  computeNextNumber,
  prefixFor,
} = require("./invoiceMath");
const { sendMail } = require("./email");
const { buildInvoiceEmailHtml } = require("./invoiceEmailTemplate");
const { renderInvoicePdf } = require("./invoicePdf");

// Email a generated invoice to its client (best-effort).
const emailInvoice = async (invoice, user) => {
  const to = invoice.billTo?.email;
  if (!to) return;
  let attachments;
  try {
    const pdf = await renderInvoicePdf(invoice.toObject(), user || {});
    attachments = [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      },
    ];
  } catch (err) {
    console.error("Recurring PDF attach failed:", err.message);
  }
  await sendMail({
    to,
    subject: `Invoice ${invoice.invoiceNumber} from ${
      invoice.billFrom?.businessName || "InvoSutra"
    }`,
    html: buildInvoiceEmailHtml(invoice),
    attachments,
  });
};

const TERM_DAYS = { "Net 15": 15, "Net 30": 30, "Net 60": 60, "Due on receipt": 0 };

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const advance = (date, frequency) => {
  const d = new Date(date);
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else if (frequency === "quarterly") d.setMonth(d.getMonth() + 3);
  else if (frequency === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d;
};

// Generate one invoice from a recurring template.
const generateInvoice = async (recurring, when = new Date()) => {
  const { items, subTotal, taxTotal } = computeTotals(recurring.items);
  const discountTotal = computeDiscount(subTotal, recurring.discount);
  const total = Math.max(subTotal + taxTotal - discountTotal, 0);
  const dueDate = addDays(when, TERM_DAYS[recurring.paymentTerms] ?? 15);

  const user = await User.findById(recurring.user).select(
    "invoicePrefix docPrefixes"
  );
  const prefix = prefixFor("invoice", user?.invoicePrefix, user?.docPrefixes);
  let next = await computeNextNumber(recurring.user, "invoice");
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await Invoice.create({
        user: recurring.user,
        invoiceNumber: formatNumber(prefix, next),
        invoiceDate: when,
        dueDate,
        billFrom: recurring.billFrom,
        billTo: recurring.billTo,
        items,
        notes: recurring.notes,
        paymentTerms: recurring.paymentTerms,
        theme: recurring.theme,
        discount: recurring.discount,
        status: "Unpaid",
        subTotal,
        taxTotal,
        discountTotal,
        total,
      });
    } catch (err) {
      if (err.code === 11000 && attempt < 4) {
        next += 1;
        continue;
      }
      throw err;
    }
  }
};

// Run all recurring templates whose nextRun is due.
const runDueRecurring = async () => {
  const now = new Date();
  const due = await RecurringInvoice.find({ active: true, nextRun: { $lte: now } });
  let created = 0;
  for (const r of due) {
    try {
      const user = r.autoEmail ? await User.findById(r.user) : null;
      // Catch up if several periods were missed, but cap to avoid runaways.
      let guard = 0;
      while (r.active && r.nextRun <= now && guard < 24) {
        // Stop at the end date or occurrence cap.
        if (r.endDate && r.nextRun > r.endDate) {
          r.active = false;
          break;
        }
        if (r.maxOccurrences && r.generatedCount >= r.maxOccurrences) {
          r.active = false;
          break;
        }
        const invoice = await generateInvoice(r, r.nextRun);
        if (r.autoEmail && invoice) {
          try {
            await emailInvoice(invoice, user);
          } catch (mailErr) {
            console.error("Recurring auto-email failed:", mailErr.message);
          }
        }
        r.lastRun = r.nextRun;
        r.nextRun = advance(r.nextRun, r.frequency);
        r.generatedCount += 1;
        created += 1;
        guard += 1;
        // Deactivate once the cap/end is reached post-generation.
        if (r.maxOccurrences && r.generatedCount >= r.maxOccurrences) {
          r.active = false;
          break;
        }
        if (r.endDate && r.nextRun > r.endDate) {
          r.active = false;
          break;
        }
      }
      await r.save();
    } catch (err) {
      console.error("Recurring generation failed for", r._id, err.message);
    }
  }
  if (created) console.log(`[recurring] generated ${created} invoice(s)`);
  return created;
};

module.exports = { runDueRecurring, generateInvoice, advance };
