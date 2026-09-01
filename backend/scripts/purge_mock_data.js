const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Notification = require("../models/Notification");

async function purgeMockData() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/mobile_controller";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for data purge...");

    // Remove legacy mock messages like "How are you", "Test Notification", etc.
    const result = await Notification.deleteMany({
      $or: [
        { message: { $regex: /how are you/i } },
        { title: { $regex: /how are you/i } },
        { message: { $regex: /test/i } },
        { title: { $regex: /test/i } },
      ],
    });

    console.log(`Purged ${result.deletedCount} legacy mock notification(s).`);
    await mongoose.disconnect();
  } catch (err) {
    console.error("Purge Error:", err);
    process.exit(1);
  }
}

purgeMockData();
