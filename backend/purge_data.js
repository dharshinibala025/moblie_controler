require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Device = require("./models/Device");
const ScannedApp = require("./models/ScannedApp");
const UsageLog = require("./models/UsageLog");
const SpreadsheetUploadHistory = require("./models/SpreadsheetUploadHistory");
const AuditLog = require("./models/AuditLog");
const BlockedAttempt = require("./models/BlockedAttempt");
const LoginAuditLog = require("./models/LoginAuditLog");
const Notification = require("./models/Notification");

async function purgeOlderData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const userRes = await User.deleteMany({ role: { $ne: "admin" } });
    const deviceRes = await Device.deleteMany({});
    const appRes = await ScannedApp.deleteMany({});
    const logRes = await UsageLog.deleteMany({});
    const historyRes = await SpreadsheetUploadHistory.deleteMany({});
    const auditRes = await AuditLog.deleteMany({});
    const blockedRes = await BlockedAttempt.deleteMany({});
    const loginAuditRes = await LoginAuditLog.deleteMany({});
    const notificationRes = await Notification.deleteMany({});

    console.log(`Successfully purged:
- Non-Admin Users: ${userRes.deletedCount}
- Devices: ${deviceRes.deletedCount}
- Scanned Apps: ${appRes.deletedCount}
- Usage Logs: ${logRes.deletedCount}
- Upload History: ${historyRes.deletedCount}
- Audit Logs: ${auditRes.deletedCount}
- Blocked Attempts: ${blockedRes.deletedCount}
- Login Audit Logs: ${loginAuditRes.deletedCount}
- Notifications: ${notificationRes.deletedCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Purge failed:", err);
    process.exit(1);
  }
}

purgeOlderData();
