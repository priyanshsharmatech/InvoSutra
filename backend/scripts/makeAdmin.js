// Promote an existing user to admin by email.
// Usage: node scripts/makeAdmin.js user@example.com
require("dotenv").config();
const mongoose = require("mongoose");
const env = require("../config/env");
const User = require("../models/User");

const run = async () => {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/makeAdmin.js <email>");
    process.exit(1);
  }

  await mongoose.connect(env.MONGO_URI);

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.role = "admin";
  user.isSuspended = false;
  await user.save();

  console.log(`✅ ${user.email} is now an admin.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error("Failed to promote user:", err);
  await mongoose.disconnect();
  process.exit(1);
});
