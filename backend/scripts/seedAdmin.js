// Create (or reset) a ready-to-use admin account for testing.
// Usage: node scripts/seedAdmin.js
// Optionally override via env: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
//
// ⚠️  For local/testing only — never ship these credentials to production.
require("dotenv").config();
const mongoose = require("mongoose");
const env = require("../config/env");
const User = require("../models/User");

const EMAIL = (process.env.SEED_ADMIN_EMAIL || "admin@invosutra.com").toLowerCase();
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin123";
const NAME = "Admin";

const run = async () => {
  await mongoose.connect(env.MONGO_URI);

  let user = await User.findOne({ email: EMAIL });

  if (user) {
    user.name = user.name || NAME;
    user.password = PASSWORD; // re-hashed by the pre-save hook
    user.role = "admin";
    user.isSuspended = false;
    await user.save();
    console.log(`🔄 Updated existing user and ensured admin: ${EMAIL}`);
  } else {
    user = await User.create({
      name: NAME,
      email: EMAIL,
      password: PASSWORD, // hashed by the pre-save hook
      role: "admin",
    });
    console.log(`✅ Created admin user: ${EMAIL}`);
  }

  console.log("\nLogin with:");
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error("Failed to seed admin:", err);
  await mongoose.disconnect();
  process.exit(1);
});
