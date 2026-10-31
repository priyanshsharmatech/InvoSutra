const Invoice = require("../models/Invoice");
const User = require("../models/User");
const { sendMail } = require("./email");

const DAY = 24 * 60 * 60 * 1000;
const REMIND_EVERY_DAYS = 3; // don't remind more often than this
const MAX_REMINDERS = 4; // give up after this many

const fmtINR = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const reminderHtml = (inv) => {
  const balance = Math.max((inv.total || 0) - (inv.amountPaid || 0), 0);
  return `
    <div style="font-family:Arial,sans-serif;color:#1e293b;max-width:520px">
      <p>Hi ${inv.billTo?.clientName || "there"},</p>
      <p>This is a friendly reminder that invoice
        <strong>${inv.invoiceNumber}</strong> for
        <strong>${fmtINR(balance)}</strong> was due on
        ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "the due date"}
        and appears to be outstanding.</p>
      <p>If you've already made the payment, please ignore this message. Otherwise,
        we'd appreciate it being settled at your earliest convenience.</p>
      <p>Thank you,<br/>${inv.billFrom?.businessName || "InvoSutra"}</p>
    </div>`;
};

// Email overdue reminders for users who opted in. Throttled per invoice.
const runDueReminders = async () => {
  const now = new Date();

  // Only users who enabled auto-reminders.
  const optedIn = await User.find({ autoReminders: true }).select("_id");
  if (!optedIn.length) return 0;
  const userIds = optedIn.map((u) => u._id);

  const candidates = await Invoice.find({
    user: { $in: userIds },
    type: "invoice",
    deleted: { $ne: true },
    status: { $in: ["Unpaid", "Sent"] },
    dueDate: { $lt: now },
  }).limit(500);

  let sent = 0;
  for (const inv of candidates) {
    const to = inv.billTo?.email;
    if (!to) continue;
    if ((inv.reminderCount || 0) >= MAX_REMINDERS) continue;
    if (
      inv.lastReminderAt &&
      now - new Date(inv.lastReminderAt) < REMIND_EVERY_DAYS * DAY
    ) {
      continue;
    }
    try {
      await sendMail({
        to,
        subject: `Payment reminder: invoice ${inv.invoiceNumber}`,
        html: reminderHtml(inv),
      });
      inv.lastReminderAt = now;
      inv.reminderCount = (inv.reminderCount || 0) + 1;
      await inv.save();
      sent += 1;
    } catch (err) {
      console.error("Auto-reminder failed for", inv._id, err.message);
    }
  }
  if (sent) console.log(`[reminders] sent ${sent} overdue reminder(s)`);
  return sent;
};

module.exports = { runDueReminders };
