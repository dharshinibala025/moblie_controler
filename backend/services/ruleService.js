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
    rule.startedAt = new Date();
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
    rule.startedAt = new Date();
    await dispatchRule(rule, "start");
  } else if (rule.status === "paused" || rule.status === "stopped") {
    rule.startedAt = null;
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

  if (action === "start") {
    rule.status = "active";
    rule.startedAt = new Date();
  } else if (action === "pause") {
    rule.status = "paused";
    rule.startedAt = null;
  } else if (action === "stop") {
    rule.status = "stopped";
    rule.startedAt = null;
  }

  // Increment policyVersion on command state change
  rule.policyVersion = (rule.policyVersion || 1) + 1;

  await rule.save();
  await dispatchRule(rule, action);

  return rule;
};

const BATCH_SIZE = 5;

/**
 * Create a rule for a class, or update the latest existing rule for that class
 * (used by the admin bulk "Set Restriction Timing" flow so we don't stack
 * duplicate rules per class across daily applies).
 */
exports.createOrUpdateRuleForClass = async (classId, ruleData, actorId) => {
  const existing = await Rule.findOne({ targetClassId: classId }).sort({ updatedAt: -1 });
  const data = { ...ruleData, targetClassId: classId };
  try {
    if (existing) {
      if (data.institutionId && existing.institutionId && existing.institutionId !== data.institutionId) {
        return { targetClassId: classId, success: false, error: "Rule belongs to another institution" };
      }
      const rule = await exports.updateRule(existing._id, data, actorId, null);
      return { targetClassId: classId, success: true, ruleId: rule._id, created: false, updated: true };
    }
    const rule = await exports.createRule(data, actorId);
    return { targetClassId: classId, success: true, ruleId: rule._id, created: true, updated: false };
  } catch (err) {
    return { targetClassId: classId, success: false, error: err.message };
  }
};

/**
 * Apply a restriction policy to many classes in ONE request using bounded
 * concurrency (no N serial HTTP round trips from the client).
 */
exports.applyBulkRulePolicy = async (targetClassIds, ruleData, actorId) => {
  const results = [];
  for (let i = 0; i < targetClassIds.length; i += BATCH_SIZE) {
    const batch = targetClassIds.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((classId) => exports.createOrUpdateRuleForClass(classId, ruleData, actorId))
    );
    results.push(...batchResults);
  }
  return results;
};

/**
 * Pause or resume a set of class rules with a single batched pass instead of
 * one serial sendCommand + full dispatch per rule. Keeps the same observable
 * effects (rule state, policyVersion, device status, socket emit, FCM push,
 * deduped restriction notification) but with constant DB round-trips.
 */
exports.batchRuleCommand = async ({ classIds = [], action }) => {
  const validFromStatus = { pause: "active", start: "paused" };
  const fromStatus = validFromStatus[action];
  if (!fromStatus) {
    throw new ValidationError(`Unsupported batch action '${action}'`);
  }
  const newStatus = action === "pause" ? "paused" : "active";
  const deviceStatus = action === "pause" ? "active" : "blocked";

  const query = { status: fromStatus };
  if (classIds && classIds.length > 0) {
    query.targetClassId = { $in: classIds };
  }

  const affectedRules = await Rule.find(query)
    .select("_id targetClassId reason")
    .lean();

  const affectedClassIds = [...new Set(affectedRules.map((r) => r.targetClassId).filter(Boolean))];

  if (affectedRules.length > 0) {
    await Rule.updateMany(
      { _id: { $in: affectedRules.map((r) => r._id) } },
      {
        $set: { status: newStatus, startedAt: action === "start" ? new Date() : null },
        $inc: { policyVersion: 1 },
      }
    );
  }

  const serverTimestamp = new Date();

  const targetStudentIds = [];
  if (affectedClassIds.length > 0) {
    const students = await User.find({ role: "student", classId: { $in: affectedClassIds } }).select("_id");
    for (const s of students) targetStudentIds.push(s._id);
  }

  if (targetStudentIds.length > 0) {
    await Device.updateMany(
      { userId: { $in: targetStudentIds } },
      {
        $set: {
          status: deviceStatus,
          lastKnownCommand: { ruleId: null, action, serverTimestamp },
        },
      }
    );

    // Non-blocking FCM multicast for all affected devices in a single call.
    const devicesWithFcm = await Device.find({
      userId: { $in: targetStudentIds },
      fcmToken: { $ne: null },
    }).select("fcmToken").lean();
    const tokens = devicesWithFcm.map((d) => d.fcmToken).filter(Boolean);
    if (tokens.length > 0) {
      fcmService
        .sendToMultipleDevices(tokens, {
          action,
          status: newStatus,
          serverTimestamp: serverTimestamp.toISOString(),
        })
        .catch(() => {});
    }

    // Deduped restriction notification (one per student for this action).
    const Notification = require("../models/Notification");
    const title = action === "pause" ? "Policy Restriction Paused" : "Classroom Restriction Activated";
    const reason = affectedRules[0]?.reason;
    const message = reason ? `Admin Instruction: ${reason}` : `Classroom restriction rule ${action}ed.`;

    const existing = await Notification.find({
      studentId: { $in: targetStudentIds },
      type: "restriction",
      title,
      message,
      read: false,
    }).select("studentId");

    const existingSet = new Set(existing.map((n) => n.studentId.toString()));
    const toCreate = targetStudentIds
      .filter((sId) => !existingSet.has(sId.toString()))
      .map((sId) => ({
        studentId: sId,
        title,
        message,
        type: "restriction",
        read: false,
      }));

    if (toCreate.length > 0) {
      await Notification.insertMany(toCreate);
    }
  }

  for (const cid of affectedClassIds) {
    emitToClass(cid, "rule:update", {
      action,
      status: newStatus,
      serverTimestamp: serverTimestamp.toISOString(),
    });
  }

  logger.info(`Batch [${action}] applied to ${affectedRules.length} rules across ${affectedClassIds.length} classes.`);
  return { affectedRules: affectedRules.length, affectedClassIds };
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

  // Determine device status based on action
  const deviceStatusMap = { start: "blocked", pause: "active", stop: "active" };
  const newDeviceStatus = deviceStatusMap[action] || "active";

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

  if (targetDevices.length > 0) {
    const targetDeviceIds = targetDevices.map((d) => d._id);
    await Device.updateMany(
      { _id: { $in: targetDeviceIds } },
      {
        $set: {
          status: newDeviceStatus,
          lastKnownCommand: {
            ruleId: rule._id,
            action,
            serverTimestamp,
          },
        },
      }
    );

    // Non-blocking async FCM dispatch for devices with FCM tokens
    const devicesWithFcm = targetDevices.filter((d) => d.fcmToken);
    if (devicesWithFcm.length > 0) {
      Promise.allSettled(
        devicesWithFcm.map((device) =>
          fcmService.sendToDevice(device.fcmToken, {
            ruleId: rule._id.toString(),
            action,
            blockedApps: JSON.stringify(rule.blockedApps),
            scheduleStart: rule.scheduleStart,
            scheduleEnd: rule.scheduleEnd,
            activeDays: JSON.stringify(rule.activeDays),
            status: rule.status,
            policyVersion: String(rule.policyVersion || 1),
            serverTimestamp: serverTimestamp.toISOString(),
          })
        )
      ).catch(() => {});
    }
  }

  const Notification = require("../models/Notification");
  const notificationTitle = action === "start" ? "Classroom Restriction Activated" : action === "pause" ? "Policy Restriction Paused" : "Classroom Policy Stopped";
  const notificationMsg = rule.reason ? `Admin Instruction: ${rule.reason}` : `Classroom restriction rule ${action}ed for schedule ${rule.scheduleStart} – ${rule.scheduleEnd}.`;

  if (targetStudentIds.length > 0) {
    // Deduplicate: never stack identical unread restriction notifications for
    // the same student (repeated dispatches / auto-pause must not spam the list).
    const existing = await Notification.find({
      studentId: { $in: targetStudentIds },
      type: "restriction",
      title: notificationTitle,
      message: notificationMsg,
      read: false,
    }).select("studentId");

    const existingSet = new Set(existing.map((n) => n.studentId.toString()));
    const notificationsToCreate = targetStudentIds
      .filter((sId) => !existingSet.has(sId.toString()))
      .map((sId) => ({
        studentId: sId,
        title: notificationTitle,
        message: notificationMsg,
        type: "restriction",
        read: false,
      }));

    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
    }
  }

  logger.info(`Dispatched scoped [${scopeType}] rule ${rule._id} [${action}] to ${targetDevices.length} devices and ${targetStudentIds.length} students.`);
}
