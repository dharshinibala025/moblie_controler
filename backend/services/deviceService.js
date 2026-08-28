const Device = require("../models/Device");
const User = require("../models/User");
const auditService = require("./auditService");
const logger = require("../utils/logger");

class DeviceService {
  async getDevices(classId, institutionId) {
    const userQuery = { role: "student" };
    if (classId) userQuery.classId = classId;
    if (institutionId) userQuery.institutionId = institutionId;

    const students = await User.find(userQuery).select("_id");
    const query = { userId: { $in: students.map((s) => s._id) } };

    return Device.find(query)
      .populate("userId", "name email classId institutionId")
      .sort({ lastSyncAt: -1 });
  }

  async getDeviceByUser(userId) {
    return Device.findOne({ userId });
  }

  async getDeviceByFingerprint(userId, deviceFingerprint) {
    return Device.findOne({ userId, deviceFingerprint });
  }

  async registerDevice(userId, fcmToken, deviceInfo, deviceFingerprint) {
    let device = await Device.findOne({ userId, deviceFingerprint });

    if (device) {
      device.fcmToken = fcmToken;
      device.status = "online";
      device.lastSyncAt = new Date();
      if (deviceInfo) device.deviceInfo = deviceInfo;
      await device.save();
    } else {
      // Deactivate stale FCM tokens on older devices for this user
      await Device.updateMany(
        { userId, deviceFingerprint: { $ne: deviceFingerprint } },
        { status: "offline", fcmToken: null }
      );

      device = await Device.create({
        userId,
        fcmToken,
        deviceFingerprint,
        deviceInfo,
        status: "online",
        lastSyncAt: new Date(),
      });
    }

    await auditService.logAction(
      userId,
      "student",
      "device.register",
      { type: "device", id: device._id }
    );

    return device;
  }

  async updateFCMToken(userId, fcmToken) {
    const device = await Device.findOne({ userId });
    if (device) {
      device.fcmToken = fcmToken;
      await device.save();
    }
    return device;
  }

  async handleTamper(device, userId, role, ruleId, tamperDetails, receivedAt, appliedAt) {
    await auditService.logAction(
      userId,
      role,
      "tamper.detected",
      { type: "device", id: device._id },
      { ruleId, tamperDetails, receivedAt, appliedAt }
    );

    device.isCompliant = false;
    await device.save();

    logger.warn(`Tamper detected on device ${device._id} by student ${userId}`);
  }
}

module.exports = new DeviceService();
