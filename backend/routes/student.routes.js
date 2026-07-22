const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const Device = require("../models/Device");
const scanService = require("../services/scanService");
const usageService = require("../services/usageService");
const auditService = require("../services/auditService");
const dispatchService = require("../services/dispatchService");
const logger = require("../utils/logger");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("student"));

const verifyDevice = async (req, res, next) => {
  try {
    const device = await Device.findOne({ userId: req.user.userId });
    if (!device) {
      return res.status(403).json({ error: "No registered device found. Please register your device first." });
    }
    req.device = device;
    next();
  } catch (err) {
    next(err);
  }
};

router.post("/device/register", async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    let device = await Device.findOne({ userId: req.user.userId });

    if (device) {
      device.fcmToken = fcmToken;
      device.status = "online";
      device.lastSyncAt = new Date();
      await device.save();
    } else {
      device = await Device.create({
        userId: req.user.userId,
        fcmToken,
        status: "online",
        lastSyncAt: new Date(),
      });
    }

    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "device.register",
      { type: "device", id: device._id }
    );

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

router.post("/scan", verifyDevice, async (req, res, next) => {
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

router.post("/usage", verifyDevice, async (req, res, next) => {
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

router.post("/command/ack", verifyDevice, async (req, res, next) => {
  try {
    const { ruleId, receivedAt, appliedAt, tamperDetected, tamperDetails } = req.body;

    if (tamperDetected) {
      await auditService.logAction(
        req.user.userId,
        req.user.role,
        "tamper.detected",
        { type: "device", id: req.device._id },
        { ruleId, tamperDetails, receivedAt, appliedAt }
      );

      req.device.isCompliant = false;
      await req.device.save();

      logger.warn(`Tamper detected on device ${req.device._id} by student ${req.user.userId}`);
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
