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
    const ScannedApp = require("../models/ScannedApp");
    const UsageLog = require("../models/UsageLog");
    const Device = require("../models/Device");
    const Notification = require("../models/Notification");
    const autoBlockService = require("../services/autoBlockService");

    const student = await User.findById(req.user.userId).populate("departmentId sectionId academicYearId");
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const device = await Device.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 });

    const policy = await autoBlockService.getStudentPolicy({ student, device, now: new Date() });
    const blockedSet = new Set(policy.blockedPackages);

    const scannedApps = await ScannedApp.find({ studentId: req.user.userId }).sort({ appName: 1 });
    const blockedAppList = scannedApps.filter((app) => blockedSet.has(app.packageName));

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

    const isActive = policy.scheduleActive;
    let remainingTime = "No active restriction window";
    if (isActive) {
      const [endH, endM] = policy.scheduleEnd.split(":").map(Number);
      const endTime = new Date().setHours(endH, endM, 0, 0);
      const diffMs = Math.max(0, endTime - Date.now());
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      remainingTime = `Remaining: ${hours} Hours ${mins} Minutes`;
    } else if (policy.source === "default") {
      remainingTime = `Schedule Window: ${policy.scheduleStart} – ${policy.scheduleEnd}`;
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
        schedule: `${policy.scheduleStart} – ${policy.scheduleEnd}`,
        remainingTime,
        reason: policy.restrictionReason,
        source: policy.source,
        noticeText: isActive
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
    const User = require("../models/User");
    const ScannedApp = require("../models/ScannedApp");
    const Device = require("../models/Device");
    const autoBlockService = require("../services/autoBlockService");

    const student = await User.findById(req.user.userId);
    const device = await Device.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 });

    const policy = await autoBlockService.getStudentPolicy({ student, device, now: new Date() });
    const blockedSet = new Set(policy.blockedPackages);

    const scannedApps = await ScannedApp.find({ studentId: req.user.userId, removedAt: null }).sort({ appName: 1 });

    const appList = scannedApps.map((app) => ({
      id: app._id,
      name: app.appName,
      packageName: app.packageName,
      category: app.category,
      versionName: app.versionName,
      blocked: blockedSet.has(app.packageName),
      scannedAt: app.scannedAt,
    }));

    res.json({
      apps: appList,
      scheduleActive: policy.scheduleActive,
      scheduleStart: policy.scheduleStart,
      scheduleEnd: policy.scheduleEnd,
      activeDays: policy.activeDays,
      source: policy.source,
      restrictionReason: policy.restrictionReason,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/notifications", async (req, res, next) => {
  try {
    const Notification = require("../models/Notification");
    const notifications = await Notification.find({
      $or: [
        { studentId: req.user.userId },
        { recipientId: req.user.userId },
        { recipientRole: "student" },
        { recipientRole: "all" },
      ],
    })
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
      $or: [
        { studentId: req.user.userId },
        { recipientId: req.user.userId },
        { recipientRole: "student" },
        { recipientRole: "all" },
      ],
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

router.post("/blocked-attempt", async (req, res, next) => {
  try {
    const { packageName, appName, policyVersion, attemptedAt } = req.body;
    const User = require("../models/User");
    const BlockedAttempt = require("../models/BlockedAttempt");
    const StaffAssignment = require("../models/StaffAssignment");
    const Notification = require("../models/Notification");
    const { emitToClass } = require("../config/socket");

    const student = await User.findById(req.user.userId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const device = await deviceService.getDeviceByUser(req.user.userId);
    if (!device) {
      return res.status(403).json({ error: "Device not registered" });
    }

    const attempt = await BlockedAttempt.create({
      studentId: req.user.userId,
      deviceId: device._id,
      packageName,
      appName: appName || "",
      policyVersion: policyVersion || 1,
      attemptedAt: attemptedAt ? new Date(attemptedAt) : new Date(),
    });

    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "blocked_attempt",
      { type: "device", id: device._id },
      { packageName, appName, policyVersion },
      student.institutionId || "KSRCE"
    );

    // Fetch Admin users
    const admins = await User.find({ role: "admin" }).select("_id");
    const adminIds = admins.map((a) => a._id);

    // Fetch assigned Staff users for this class
    const assignments = await StaffAssignment.find({ classId: student.classId, isActive: true });
    const staffIds = assignments.map((a) => a.staffId);

    const recipientIds = [...new Set([...adminIds, ...staffIds])];

    const modelName = device.deviceInfo?.deviceModel || device.deviceInfo?.model || "student device";
    const displayName = student.name;
    const resolvedAppName = appName || packageName;

    const notificationsToCreate = recipientIds.map((recId) => ({
      studentId: recId,
      title: "Unauthorized App Restriction Triggered",
      message: `High risk app (${resolvedAppName}) launched during restriction hours on ${modelName} (${displayName}).`,
      type: "restriction",
      metadata: {
        studentId: student._id,
        packageName,
        deliveredCount: 1,
        readCount: 0,
        target: student.classId || "General",
      },
    }));

    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
    }

    emitToClass("ALL", "notification:new", { timestamp: new Date() });

    res.status(201).json({ success: true, attemptId: attempt._id });
  } catch (err) {
    next(err);
  }
});

router.post("/app-unblocked", async (req, res, next) => {
  try {
    const { packageName, appName } = req.body;
    const User = require("../models/User");
    const StaffAssignment = require("../models/StaffAssignment");
    const Notification = require("../models/Notification");
    const { emitToClass } = require("../config/socket");

    const student = await User.findById(req.user.userId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const device = await deviceService.getDeviceByUser(req.user.userId);
    const modelName = device?.deviceInfo?.deviceModel || device?.deviceInfo?.model || "Student Device";
    const displayName = student.name;
    const resolvedAppName = appName || packageName || "Restricted Application";

    // Fetch Admin users
    const admins = await User.find({ role: "admin" }).select("_id");
    const adminIds = admins.map((a) => a._id);

    // Fetch assigned Staff users for this class
    const assignments = await StaffAssignment.find({ classId: student.classId, isActive: true });
    const staffIds = assignments.map((a) => a.staffId);

    const recipientIds = [...new Set([...adminIds, ...staffIds])];

    const notificationsToCreate = [];

    // Notifications for Admins
    adminIds.forEach((adminId) => {
      notificationsToCreate.push({
        recipientId: adminId,
        recipientRole: "admin",
        studentId: student._id,
        title: "Blocked Application Unblocked",
        message: `Student ${displayName} (${student.studentId || 'ID'}) unblocked/accessed application (${resolvedAppName}) on device (${modelName}).`,
        type: "restriction",
        metadata: {
          studentId: student._id,
          packageName,
          appName: resolvedAppName,
          unblockedAt: new Date(),
          target: student.classId || "General",
        },
      });
    });

    // Notifications for Staff
    staffIds.forEach((staffId) => {
      notificationsToCreate.push({
        recipientId: staffId,
        recipientRole: "staff",
        studentId: student._id,
        title: "Blocked Application Unblocked",
        message: `Student ${displayName} (${student.studentId || 'ID'}) unblocked/accessed application (${resolvedAppName}) on device (${modelName}).`,
        type: "restriction",
        metadata: {
          studentId: student._id,
          packageName,
          appName: resolvedAppName,
          unblockedAt: new Date(),
          target: student.classId || "General",
        },
      });
    });

    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
    }

    emitToClass("ALL", "notification:new", { timestamp: new Date() });

    res.status(201).json({ success: true, message: "Unblock notification dispatched to Admin and Staff." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
