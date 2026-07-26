const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validation");
const deviceService = require("../services/deviceService");
const scanService = require("../services/scanService");
const usageService = require("../services/usageService");
const auditService = require("../services/auditService");
const dispatchService = require("../services/dispatchService");
const Session = require("../models/Session");
const logger = require("../utils/logger");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("student"));

const verifyDevice = async (req, res, next) => {
  try {
    const device = await deviceService.getDeviceByUser(req.user.userId);
    if (!device) {
      return res.status(403).json({ error: "No registered device found. Please register your device first." });
    }
    req.device = device;
    next();
  } catch (err) {
    next(err);
  }
};

router.post("/device/register", validate("registerDevice"), async (req, res, next) => {
  try {
    const { fcmToken, deviceInfo } = req.body;
    const deviceFingerprint = Session.generateDeviceFingerprint(deviceInfo);
    const device = await deviceService.registerDevice(req.user.userId, fcmToken, deviceInfo, deviceFingerprint);
    const currentCommand = await dispatchService.getLatestCommand(req.user.classId);

    res.status(201).json({
      deviceId: device._id,
      status: device.status,
      currentCommand,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/scan", verifyDevice, validate("scanApps"), async (req, res, next) => {
  try {
    const result = await scanService.processScan(
      req.user.userId,
      req.device._id,
      req.body.apps
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/usage", verifyDevice, validate("usageLogs"), async (req, res, next) => {
  try {
    const result = await usageService.recordUsage(
      req.user.userId,
      req.device._id,
      req.body.logs
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/command/ack", verifyDevice, validate("commandAck"), async (req, res, next) => {
  try {
    const { ruleId, receivedAt, appliedAt, tamperDetected, tamperDetails } = req.body;

    if (tamperDetected) {
      await deviceService.handleTamper(
        req.device,
        req.user.userId,
        req.user.role,
        ruleId,
        tamperDetails,
        receivedAt,
        appliedAt
      );
    }

    res.json({
      acknowledged: true,
      ruleId,
      serverTimestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/dashboard", async (req, res, next) => {
  try {
    const User = require("../models/User");
    const Rule = require("../models/Rule");
    const ScannedApp = require("../models/ScannedApp");
    const UsageLog = require("../models/UsageLog");
    const Device = require("../models/Device");
    const Notification = require("../models/Notification");

    const student = await User.findById(req.user.userId).populate("departmentId sectionId academicYearId");
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const device = await Device.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 });

    const activeRules = await Rule.find({
      $or: [
        { targetClassId: student.classId },
        { "targetScope.type": "student", "targetScope.targetId": student._id.toString() },
        { "targetScope.type": "class", "targetScope.targetId": student.classId },
        { "targetScope.type": "institution", "targetScope.targetId": student.institutionId || "KSRCE" },
      ],
      status: "active",
    }).sort({ updatedAt: -1 });

    const activeRule = activeRules[0] || null;
    const blockedAppsSet = new Set();
    activeRules.forEach((rule) => {
      rule.blockedApps.forEach((app) => blockedAppsSet.add(app));
    });

    const scannedApps = await ScannedApp.find({ studentId: req.user.userId }).sort({ appName: 1 });
    const blockedAppList = scannedApps.filter((app) => blockedAppsSet.has(app.packageName));

    const recentLogs = await UsageLog.find({ studentId: req.user.userId })
      .sort({ timestamp: -1 })
      .limit(10);

    const formattedActivity = recentLogs.map((log) => ({
      id: log._id.toString(),
      time: new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: log.wasBlockedAttempt ? "blocked" : "usage",
      title: log.wasBlockedAttempt ? "Blocked Attempt" : "App Usage",
      details: `${log.packageName} — ${Math.round(log.durationMs / 1000)}s`,
    }));

    const unreadNotificationCount = await Notification.countDocuments({
      studentId: req.user.userId,
      read: false,
    });

    let isActive = false;
    let remainingTime = "No active restriction";

    if (activeRule) {
      const now = new Date();
      const [startH, startM] = activeRule.scheduleStart.split(":").map(Number);
      const [endH, endM] = activeRule.scheduleEnd.split(":").map(Number);
      const startTime = new Date(now).setHours(startH, startM, 0, 0);
      const endTime = new Date(now).setHours(endH, endM, 0, 0);

      if (now >= startTime && now <= endTime) {
        isActive = true;
        const diffMs = endTime - now;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        remainingTime = `Remaining: ${hours} Hours ${mins} Minutes`;
      }
    }

    res.json({
      student: {
        id: student._id,
        name: student.name,
        registerNumber: student.studentId || "N/A",
        department: student.departmentId ? student.departmentId.name : "Engineering",
        section: student.sectionId ? student.sectionId.name : "Section A",
        email: student.email,
        classId: student.classId,
      },
      restrictionStatus: {
        isActive,
        statusTitle: isActive ? "Restrictions Active" : "No Restrictions Active",
        schedule: activeRule ? `${activeRule.scheduleStart} – ${activeRule.scheduleEnd}` : "N/A",
        remainingTime,
        reason: activeRule ? activeRule.reason : "",
        noticeText: activeRule
          ? `Controlled by Department Admin during class hours.`
          : `No policy currently applied.`,
      },
      blockedAppsCount: blockedAppList.length,
      scannedAppsCount: scannedApps.length,
      blockedApps: blockedAppList.map((app) => ({
        id: app._id,
        name: app.appName,
        packageName: app.packageName,
        category: app.category,
        blocked: true,
      })),
      recentActivity: formattedActivity,
      deviceStatus: {
        status: device ? device.status : "offline",
        lastSeenAt: device ? device.updatedAt : null,
      },
      unreadNotificationCount,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/apps", async (req, res, next) => {
  try {
    const Rule = require("../models/Rule");
    const ScannedApp = require("../models/ScannedApp");
    const User = require("../models/User");

    const student = await User.findById(req.user.userId);
    const scannedApps = await ScannedApp.find({ studentId: req.user.userId }).sort({ appName: 1 });

    const activeRules = await Rule.find({
      $or: [
        { targetClassId: student.classId },
        { "targetScope.type": "student", "targetScope.targetId": student._id.toString() },
        { "targetScope.type": "class", "targetScope.targetId": student.classId },
        { "targetScope.type": "institution", "targetScope.targetId": student.institutionId || "KSRCE" },
      ],
      status: "active",
    });

    const blockedAppsSet = new Set();
    activeRules.forEach((rule) => {
      rule.blockedApps.forEach((app) => blockedAppsSet.add(app));
    });

    const appList = scannedApps.map((app) => ({
      id: app._id,
      name: app.appName,
      packageName: app.packageName,
      category: app.category,
      versionName: app.versionName,
      blocked: blockedAppsSet.has(app.packageName),
      scannedAt: app.scannedAt,
    }));

    res.json({ apps: appList });
  } catch (err) {
    next(err);
  }
});

router.get("/notifications", async (req, res, next) => {
  try {
    const Notification = require("../models/Notification");
    const notifications = await Notification.find({ studentId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

router.get("/notifications/unread-count", async (req, res, next) => {
  try {
    const Notification = require("../models/Notification");
    const unreadCount = await Notification.countDocuments({
      studentId: req.user.userId,
      read: false,
    });

    res.json({ unreadCount });
  } catch (err) {
    next(err);
  }
});

router.post("/notifications/:id/read", async (req, res, next) => {
  try {
    const Notification = require("../models/Notification");
    await Notification.updateOne(
      { _id: req.params.id, studentId: req.user.userId },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
