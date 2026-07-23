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

module.exports = router;
