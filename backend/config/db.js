const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI, {});
    console.log("MongoDB connected!");
  } catch (err) {
    console.error("Error connecting to MongoDB", err);
    process.exit(1);
  }
};

module.exports = connectDB;
