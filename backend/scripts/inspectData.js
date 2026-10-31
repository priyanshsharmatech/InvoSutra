// Diagnostic: report users, invoices, and any orphaned invoices
// (invoices whose `user` no longer exists). Read-only.
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const env = require("../config/env");
const User = require("../models/User");
const Invoice = require("../models/Invoice");

const run = async () => {
  await mongoose.connect(env.MONGO_URI);

  const users = await User.find().select("name email role isSuspended");
  const invoices = await Invoice.find().select(
    "invoiceNumber user total status billTo.clientName"
  );

  console.log(`\n=== USERS (${users.length}) ===`);
  users.forEach((u) =>
    console.log(`  ${u._id} | ${u.email} | ${u.role}`)
  );

  const userIds = new Set(users.map((u) => u._id.toString()));

  const orphans = invoices.filter(
    (inv) => !inv.user || !userIds.has(inv.user.toString())
  );
  const valid = invoices.filter(
    (inv) => inv.user && userIds.has(inv.user.toString())
  );

  console.log(`\n=== INVOICES (${invoices.length}) ===`);
  console.log(`  Valid (owner exists):   ${valid.length}`);
  console.log(`  Orphaned (no owner):    ${orphans.length}`);

  if (orphans.length) {
    console.log(`\n--- Orphaned invoices ---`);
    const missingOwners = new Set();
    orphans.forEach((inv) => {
      missingOwners.add(String(inv.user));
      console.log(
        `  #${inv.invoiceNumber} | owner=${inv.user} | ₹${inv.total} | ${inv.status} | ${inv.billTo?.clientName || "-"}`
      );
    });
    console.log(
      `\n  Distinct missing owner ids: ${[...missingOwners].join(", ")}`
    );
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error("Inspect failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
