const Rule = require("../models/Rule");
const Device = require("../models/Device");
const User = require("../models/User");
const { emitToClass } = require("../config/socket");
const fcmService = require("./fcmService");
const logger = require("../utils/logger");
const { NotFoundError, ValidationError, ForbiddenError } = require("../utils/AppError");

exports.createRule = async (ruleData, actorId) => {
  const targetScope = ruleData.targetScope || { type: "class", targetId: ruleData.targetClassId };
  const rule = await Rule.create({
    ...ruleData,
    targetScope,
    policyVersion: 1,
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
  // Increment policyVersion on changes
  rule.policyVersion = (rule.policyVersion || 1) + 1;

  Object.assign(rule, updateData);
  await rule.save();

  if (rule.status !== previousStatus && rule.status === "active") {
    await dispatchRule(rule, "start");
  } else if (rule.status === "paused" || rule.status === "stopped") {
    await dispatchRule(rule, rule.status === "paused" ? "pause" : "stop");
  } else {
    // If rule remains active but other parameters (like blockedApps) change, dispatch update
    if (rule.status === "active") {
      await dispatchRule(rule, "start");
    }
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
    start: ["draft", "paused"],
    pause: ["active"],
    stop: ["active", "paused"],
  };

  if (!validTransitions[action] || !validTransitions[action].includes(rule.status)) {
    throw new ValidationError(`Cannot '${action}' a rule with status '${rule.status}'`);
  }

  if (action === "start") rule.status = "active";
  else if (action === "pause") rule.status = "paused";
  else if (action === "stop") rule.status = "stopped";

  // Increment policyVersion on command state change
  rule.policyVersion = (rule.policyVersion || 1) + 1;

  await rule.save();
  await dispatchRule(rule, action);

  return rule;
};

async function dispatchRule(rule, action) {
  const serverTimestamp = new Date();

  // Resolve scope target
  const scopeType = rule.targetScope?.type || "class";
  const targetId = rule.targetScope?.targetId || rule.targetClassId;

  const mongoose = require("mongoose");
  const userQuery = { role: "student" };
  const isValidObjId = targetId && mongoose.Types.ObjectId.isValid(targetId);

  if (scopeType === "student") {
    if (isValidObjId) userQuery._id = targetId;
  } else if (scopeType === "class") {
    if (isValidObjId) {
      userQuery.$or = [{ classId: targetId }, { classRoomId: targetId }];
    } else {
      userQuery.classId = targetId;
    }
  } else if (scopeType === "department") {
    if (isValidObjId) userQuery.departmentId = targetId;
  } else if (scopeType === "year") {
    if (isValidObjId) userQuery.academicYearId = targetId;
  } else if (scopeType === "institution") {
    userQuery.institutionId = targetId;
  }

  const targetStudents = await User.find(userQuery).select("_id");
  const targetStudentIds = targetStudents.map((s) => s._id);

  // Retrieve target devices
  const targetDevices = await Device.find({ userId: { $in: targetStudentIds } });

  // Broadcast using Socket class logic
  emitToClass(rule.targetClassId, "rule:update", {
    ruleId: rule._id,
    action,
    blockedApps: rule.blockedApps,
    scheduleStart: rule.scheduleStart,
    scheduleEnd: rule.scheduleEnd,
    activeDays: rule.activeDays,
    status: rule.status,
    policyVersion: rule.policyVersion,
    serverTimestamp: serverTimestamp.toISOString(),
  });

  for (const device of targetDevices) {
    device.lastKnownCommand = {
      ruleId: rule._id,
      action,
      serverTimestamp,
    };
    await device.save();

    if (device.fcmToken) {
      try {
        await fcmService.sendToDevice(device.fcmToken, {
          ruleId: rule._id.toString(),
          action,
          blockedApps: JSON.stringify(rule.blockedApps),
          scheduleStart: rule.scheduleStart,
          scheduleEnd: rule.scheduleEnd,
          activeDays: JSON.stringify(rule.activeDays),
          status: rule.status,
          policyVersion: String(rule.policyVersion || 1),
          serverTimestamp: serverTimestamp.toISOString(),
        });
      } catch (err) {
        logger.error(`FCM dispatch failed for device ${device._id}: ${err.message}`);
      }
    }
  }

  logger.info(`Dispatched scoped [${scopeType}] rule ${rule._id} [${action}] to ${targetDevices.length} devices`);
}
