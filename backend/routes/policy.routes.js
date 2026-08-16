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

    const student = await User.findById(device.userId).lean();
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const { getEmergencyUnblock } = require("../utils/emergencyHelper");

    const SOCIAL_MEDIA_AND_GAMES_PACKAGES = [
      "com.instagram.android",
      "com.whatsapp",
      "org.telegram.messenger",
      "com.snapchat.android",
      "com.twitter.android",
      "com.facebook.katana",
      "com.google.android.youtube",
      "com.instagram.barcelona", // Threads
      "in.startv.hotstar",       // Hotstar
      "com.jio.media.ondemand",  // JioCinema
      "com.netflix.mediaclient",
      "com.netmirror",
      "com.sun.nxt",
      "com.amazon.avod.thirdpartyclient", // Prime Video
      "com.airtel.tv",           // Airtel Xstream
      "com.graymatrix.did",      // Zee5
      "com.android.vending",     // Google Play Store
      "com.dts.freefireth",      // Free fire
      "com.tencent.ig",          // PUBG
      "com.pubg.imobile",        // BGMI
      "com.discord"              // Discord
    ];

    const getAutoBlockPackages = async (studentId) => {
      const blocked = [...SOCIAL_MEDIA_AND_GAMES_PACKAGES];
      try {
        const ScannedApp = require("../models/ScannedApp");
        const categorized = await ScannedApp.find({
          studentId,
          category: { $in: ["games", "social"] },
          removedAt: null
        }).lean();
        const seen = new Set(blocked);
        for (const app of categorized) {
          if (!seen.has(app.packageName)) {
            blocked.push(app.packageName);
          }
        }
      } catch (err) {
        logger.error("Error fetching scanned games/social apps for auto-block:", err);
      }
      return blocked;
    };

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
    }).sort({ updatedAt: -1 }).lean();

    const { isRuleActiveNow } = require("../utils/scheduleHelper");
    const currentlyEnforcedRules = activeRules.filter((rule) => isRuleActiveNow(rule, new Date()));

    let blockedPackages = [];
    let maxPolicyVersion = 0;
    let scheduleStart = "09:00";
    let scheduleEnd = "16:00";
    let activeDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let reason = "All social media and games blocked automatically";
    let status = "active";

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

    if (device.status === "blocked") {
      // Manual individual device block overrides everything
      blockedPackages = await getAutoBlockPackages(student._id);
      status = "active";
      reason = "Device blocked manually by administrator";
    } else if (getEmergencyUnblock()) {
      // Global emergency unblock override
      blockedPackages = [];
      status = "inactive";
      reason = "Emergency unblock active (restrictions temporarily lifted)";
    } else if (currentlyEnforcedRules.length > 0) {
      // Inside restricted timing window (access blocked)
      blockedPackages = await getAutoBlockPackages(student._id);
      status = "active";
      reason = "Inside restricted timing window (social media and games blocked)";
    } else {
      // Outside restricted timing window / no rules exist -> unblock all
      blockedPackages = [];
      status = "inactive";
      reason = "Outside restricted timing window (social media and games unblocked)";
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
