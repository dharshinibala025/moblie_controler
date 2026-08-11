const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      logger.warn("MONGODB_URI environment variable is not defined. Database operations will fail until MONGODB_URI is configured on Render.");
      return null;
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    // Do not crash server process instantly on DB connection failure
  }
};

module.exports = connectDB;
