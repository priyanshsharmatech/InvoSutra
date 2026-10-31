// Delete orphaned invoices — invoices whose `user` no longer exists.
// Usage: node scripts/cleanOrphans.js
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const env = require("../config/env");
const User = require("../models/User");
const Invoice = require("../models/Invoice");

const run = async () => {
  await mongoose.connect(env.MONGO_URI);

  const userIds = (await User.find().select("_id")).map((u) =>
    u._id.toString()
  );
  const userIdSet = new Set(userIds);

  const invoices = await Invoice.find().select("_id user invoiceNumber");
  const orphanIds = invoices
    .filter((inv) => !inv.user || !userIdSet.has(inv.user.toString()))
    .map((inv) => inv._id);

  if (orphanIds.length === 0) {
    console.log("No orphaned invoices. Nothing to delete.");
    await mongoose.disconnect();
    process.exit(0);
  }

  const result = await Invoice.deleteMany({ _id: { $in: orphanIds } });
  console.log(`🗑️  Deleted ${result.deletedCount} orphaned invoice(s).`);

  const remaining = await Invoice.countDocuments();
  console.log(`Remaining invoices: ${remaining}`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error("Cleanup failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
