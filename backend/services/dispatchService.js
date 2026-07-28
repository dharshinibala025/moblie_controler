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

  for (const device of targetDevices) {
    device.lastKnownCommand = {
      ruleId: commandData.ruleId || null,
      action: commandData.action,
      serverTimestamp,
    };
    await device.save();
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
