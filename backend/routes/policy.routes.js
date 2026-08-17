const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Device = require("../models/Device");
const User = require("../models/User");
const SyncLog = require("../models/SyncLog");
const autoBlockService = require("../services/autoBlockService");
const logger = require("../utils/logger");

const router = express.Router();

router.use(authMiddleware);

// In-memory replay guard cache (deviceId -> timestamp)
const lastRequestCache = new Map();

router.get("/latest", async (req, res, next) => {
  try {
    const { deviceId, syncType = "periodic" } = req.query;
    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    const now = Date.now();
    const lastRequestTime = lastRequestCache.get(deviceId);
    if (process.env.NODE_ENV !== "test" && lastRequestTime && now - lastRequestTime < 2000) {
      return res.status(429).json({ error: "Replay guard: request throttled. Please wait." });
    }
    lastRequestCache.set(deviceId, now);

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    const student = await User.findById(device.userId).lean();
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const policy = await autoBlockService.getStudentPolicy({ student, device, now: new Date() });

    const policyVersionBefore = device.lastKnownCommand?.policyVersion || 0;

    device.lastKnownCommand = {
      ruleId: null,
      action: policy.status === "active" ? "start" : "stop",
      serverTimestamp: new Date(),
      policyVersion: policy.policyVersion,
    };
    device.lastSyncAt = new Date();
    await device.save();

    await SyncLog.create({
      deviceId: device._id,
      syncType,
      policyVersionBefore,
      policyVersionAfter: policy.policyVersion,
    });

    res.json({
      policyVersion: policy.policyVersion,
      blockedPackages: policy.blockedPackages,
      restrictionReason: policy.restrictionReason,
      status: policy.status,
      scheduleStart: policy.scheduleStart,
      scheduleEnd: policy.scheduleEnd,
      activeDays: policy.activeDays,
      scheduleActive: policy.scheduleActive,
      source: policy.source,
      emergency: policy.emergency,
      nextUnlockAt: policy.nextUnlockAt,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
