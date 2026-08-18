const { emitToClass } = require("../config/socket");
const fcmService = require("./fcmService");
const Rule = require("../models/Rule");
const Device = require("../models/Device");
const logger = require("../utils/logger");

exports.dispatchCommand = async (classId, commandData) => {
  const serverTimestamp = new Date();

  emitToClass(classId, "command:dispatch", {
    ...commandData,
    serverTimestamp: serverTimestamp.toISOString(),
  });

  const devices = await Device.find({ status: { $ne: "blocked" } }).populate({
    path: "userId",
    match: { classId },
    select: "_id classId",
  });

  const targetDevices = devices.filter((d) => d.userId && d.userId.classId === classId);

  const tokens = targetDevices
    .filter((d) => d.fcmToken)
    .map((d) => d.fcmToken);

  if (tokens.length > 0) {
    await fcmService.sendToMultipleDevices(tokens, {
      ...commandData,
      serverTimestamp: serverTimestamp.toISOString(),
    });
  }

  // Bulk update all target devices at once instead of sequential saves
  const targetDeviceIds = targetDevices.map((d) => d._id);
  if (targetDeviceIds.length > 0) {
    await Device.updateMany(
      { _id: { $in: targetDeviceIds } },
      {
        $set: {
          lastKnownCommand: {
            ruleId: commandData.ruleId || null,
            action: commandData.action,
            serverTimestamp,
          },
        },
      }
    );
  }

  logger.info(`Dispatched command '${commandData.action}' to class ${classId} (${targetDevices.length} devices)`);
  return { dispatched: targetDevices.length, serverTimestamp };
};

exports.getLatestCommand = async (classId) => {
  const rule = await Rule.findOne({
    targetClassId: classId,
    status: { $in: ["active", "paused"] },
  }).sort({ updatedAt: -1 });

  if (!rule) return null;

  // If rule is active but was manually started today, check if startedAt is stale (previous day)
  if (rule.status === "active" && rule.startedAt) {
    const today = new Date();
    const startedDay = new Date(rule.startedAt);
    const sameDay = today.toDateString() === startedDay.toDateString();
    if (!sameDay) {
      // startedAt is from a previous day — treat as not started today
      return {
        ruleId: rule._id,
        action: "stop",
        blockedApps: [],
        scheduleStart: rule.scheduleStart,
        scheduleEnd: rule.scheduleEnd,
        activeDays: rule.activeDays,
        serverTimestamp: rule.updatedAt,
      };
    }
  }

  return {
    ruleId: rule._id,
    action: rule.status === "active" ? "start" : "pause",
    blockedApps: rule.blockedApps,
    scheduleStart: rule.scheduleStart,
    scheduleEnd: rule.scheduleEnd,
    activeDays: rule.activeDays,
    serverTimestamp: rule.updatedAt,
  };
};
