const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Device = require("../models/Device");
const User = require("../models/User");
const Rule = require("../models/Rule");
const SyncLog = require("../models/SyncLog");
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

    const student = await User.findById(device.userId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const activeRules = await Rule.find({
      $or: [
        { targetClassId: student.classId },
        { "targetScope.type": "student", "targetScope.targetId": student._id.toString() },
        { "targetScope.type": "class", "targetScope.targetId": student.classId },
        { "targetScope.type": "institution", "targetScope.targetId": student.institutionId || "KSRCE" },
        ...(student.departmentId ? [{ "targetScope.type": "department", "targetScope.targetId": student.departmentId.toString() }] : []),
        ...(student.academicYearId ? [{ "targetScope.type": "year", "targetScope.targetId": student.academicYearId.toString() }] : []),
      ],
      status: "active",
    }).sort({ updatedAt: -1 });

    const { isRuleActiveNow } = require("../utils/scheduleHelper");
    const currentlyEnforcedRules = activeRules.filter((rule) => isRuleActiveNow(rule, new Date()));

    const blockedPackages = [];
    const seen = new Set();
    let maxPolicyVersion = 0;
    let scheduleStart = "09:00";
    let scheduleEnd = "16:00";
    let activeDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let reason = "Institutional restriction policy";
    let status = "inactive";

    if (activeRules.length > 0) {
      const primaryRule = activeRules[0];
      scheduleStart = primaryRule.scheduleStart;
      scheduleEnd = primaryRule.scheduleEnd;
      activeDays = primaryRule.activeDays;
      reason = primaryRule.reason || reason;

      for (const rule of activeRules) {
        maxPolicyVersion = Math.max(maxPolicyVersion, rule.policyVersion || 1);
      }
    }

    if (currentlyEnforcedRules.length > 0) {
      status = "active";
      for (const rule of currentlyEnforcedRules) {
        for (const pkg of rule.blockedApps) {
          if (!seen.has(pkg)) {
            seen.add(pkg);
            blockedPackages.push(pkg);
          }
        }
      }
    }

    const policyVersionBefore = device.lastKnownCommand?.policyVersion || 0;

    device.lastKnownCommand = {
      ruleId: activeRules[0]?._id || null,
      action: status === "active" ? "start" : "stop",
      serverTimestamp: new Date(),
      policyVersion: maxPolicyVersion,
    };
    device.lastSyncAt = new Date();
    await device.save();

    await SyncLog.create({
      deviceId: device._id,
      syncType,
      policyVersionBefore,
      policyVersionAfter: maxPolicyVersion,
    });

    res.json({
      policyVersion: maxPolicyVersion,
      blockedPackages,
      restrictionReason: reason,
      status,
      scheduleStart,
      scheduleEnd,
      activeDays,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
