const Rule = require("../models/Rule");
const Device = require("../models/Device");
const { emitToClass } = require("../config/socket");
const fcmService = require("./fcmService");
const logger = require("../utils/logger");
const { NotFoundError, ValidationError, ForbiddenError } = require("../utils/AppError");

exports.createRule = async (ruleData, actorId) => {
  const rule = await Rule.create({
    ...ruleData,
    createdBy: actorId,
  });

  if (rule.status === "active") {
    await dispatchRule(rule, "start");
  }

  return rule;
};

exports.updateRule = async (ruleId, updateData, actorId, institutionId) => {
  const rule = await Rule.findById(ruleId);
  if (!rule) {
    throw new NotFoundError("Rule");
  }
  if (institutionId && rule.institutionId !== institutionId) {
    throw new ForbiddenError("Access denied: rule belongs to another institution");
  }

  const previousStatus = rule.status;
  Object.assign(rule, updateData);
  await rule.save();

  if (rule.status !== previousStatus && rule.status === "active") {
    await dispatchRule(rule, "start");
  } else if (rule.status === "paused" || rule.status === "stopped") {
    await dispatchRule(rule, rule.status === "paused" ? "pause" : "stop");
  }

  return rule;
};

exports.getRules = async (filters) => {
  const query = {};
  if (filters.targetClassId) query.targetClassId = filters.targetClassId;
  if (filters.status) query.status = filters.status;
  if (filters.institutionId) query.institutionId = filters.institutionId;

  return Rule.find(query)
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });
};

exports.getRuleById = async (ruleId, institutionId) => {
  const rule = await Rule.findById(ruleId).populate("createdBy", "name email");
  if (!rule) {
    throw new NotFoundError("Rule");
  }
  if (institutionId && rule.institutionId !== institutionId) {
    throw new ForbiddenError("Access denied: rule belongs to another institution");
  }
  return rule;
};

exports.sendCommand = async (ruleId, action, actorId, institutionId) => {
  const rule = await Rule.findById(ruleId);
  if (!rule) {
    throw new NotFoundError("Rule");
  }
  if (institutionId && rule.institutionId !== institutionId) {
    throw new ForbiddenError("Access denied: rule belongs to another institution");
  }

  const validTransitions = {
    start: ["draft", "paused", "stopped"],
    pause: ["active"],
    stop: ["active", "paused"],
  };

  if (!validTransitions[action] || !validTransitions[action].includes(rule.status)) {
    throw new ValidationError(`Cannot '${action}' a rule with status '${rule.status}'`);
  }

  if (action === "start") rule.status = "active";
  else if (action === "pause") rule.status = "paused";
  else if (action === "stop") rule.status = "stopped";

  await rule.save();
  await dispatchRule(rule, action);

  return rule;
};

async function dispatchRule(rule, action) {
  const serverTimestamp = new Date();

  emitToClass(rule.targetClassId, "rule:update", {
    ruleId: rule._id,
    action,
    blockedApps: rule.blockedApps,
    scheduleStart: rule.scheduleStart,
    scheduleEnd: rule.scheduleEnd,
    activeDays: rule.activeDays,
    status: rule.status,
    serverTimestamp: serverTimestamp.toISOString(),
  });

  const devices = await Device.find({
    userId: { $exists: true },
  }).populate({
    path: "userId",
    match: { classId: rule.targetClassId },
    select: "_id classId",
  });

  const targetDevices = devices.filter((d) => d.userId && d.userId.classId === rule.targetClassId);

  for (const device of targetDevices) {
    device.lastKnownCommand = {
      ruleId: rule._id,
      action,
      serverTimestamp,
    };
    await device.save();

    if (device.fcmToken) {
      await fcmService.sendToDevice(device.fcmToken, {
        ruleId: rule._id.toString(),
        action,
        blockedApps: JSON.stringify(rule.blockedApps),
        scheduleStart: rule.scheduleStart,
        scheduleEnd: rule.scheduleEnd,
        activeDays: JSON.stringify(rule.activeDays),
        status: rule.status,
        serverTimestamp: serverTimestamp.toISOString(),
      });
    }
  }

  logger.info(`Dispatched rule ${rule._id} [${action}] to class ${rule.targetClassId} (${targetDevices.length} devices)`);
}
