const Rule = require("../models/Rule");
const Device = require("../models/Device");
const User = require("../models/User");
const { emitToClass } = require("../config/socket");
const fcmService = require("./fcmService");
const autoBlockService = require("./autoBlockService");
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
    await dispatchRule(rule, "start", { actorId, transition: "set" });
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
    await dispatchRule(rule, "start", {
      actorId,
      transition: previousStatus === "paused" ? "resume" : "set",
    });
  } else if (rule.status === "paused" || rule.status === "stopped") {
    rule.startedAt = null;
    await dispatchRule(rule, rule.status === "paused" ? "pause" : "stop", {
      actorId,
      transition: rule.status === "paused" ? "pause" : "stop",
    });
  } else {
    // If rule remains active but other parameters (like blockedApps) change, dispatch update
    if (rule.status === "active") {
      await dispatchRule(rule, "start", { actorId, transition: "set" });
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

exports.sendCommand = async (ruleId, action, actorId, institutionId, options = {}) => {
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
  await dispatchRule(rule, action, {
    actorId,
    transition: action === "start" ? "resume" : action,
    notify: options.notify !== false,
  });

  return rule;
};

const BATCH_SIZE = 5;

const DEFAULT_ACTIVE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Resolve the acting user's label for student notifications. Unknown/string
// actors (e.g. the schedule engine) fall back to "System".
const resolveActorLabel = async (actorId) => {
  try {
    if (!actorId || typeof actorId !== "string" || actorId.length !== 24) {
      return "System";
    }
    const actor = await User.findById(actorId).select("role").lean();
    if (!actor) return "System";
    return actor.role === "staff" ? "Staff" : "Admin";
  } catch (err) {
    return "System";
  }
};

// Build the full policy data block sent over socket + FCM so a device can
// update its local PolicyStorage in ONE message (no extra /policy/latest fetch).
// Socket emissions carry blockedPackages as a REAL array (the JS client checks
// Array.isArray); FCM data messages keep it JSON-stringified because FCM data
// fields only accept string values.
const buildPolicyData = (action, status, blockedPackages, rule, serverTimestamp, options = {}) => {
  const isFcm = options.fcm === true;
  const isEmergency = options.emergency === true;
  return {
    action,
    status,
    blockedPackages: isFcm ? JSON.stringify(blockedPackages || []) : blockedPackages || [],
    scheduleStart: rule && rule.scheduleStart ? rule.scheduleStart : "09:00",
    scheduleEnd: rule && rule.scheduleEnd ? rule.scheduleEnd : "16:00",
    activeDays: JSON.stringify(
      rule && rule.activeDays && rule.activeDays.length > 0 ? rule.activeDays : DEFAULT_ACTIVE_DAYS
    ),
    reason: rule && rule.reason ? rule.reason : "",
    policyVersion: String(rule && rule.policyVersion ? rule.policyVersion : 1),
    ruleId: rule && rule._id ? String(rule._id) : "",
    serverTimestamp: serverTimestamp.toISOString(),
    emergency: isEmergency ? "active" : "inactive",
  };
};

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
exports.batchRuleCommand = async ({ classIds = [], action, actorId, notify = true }) => {
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
    .select("_id targetClassId reason blockedApps scheduleStart scheduleEnd activeDays policyVersion")
    .lean();

  const affectedClassIds = [...new Set(affectedRules.map((r) => r.targetClassId).filter(Boolean))];

  // Group rules by class so we can send each class a complete, accurate
  // blocked-package list (manual-start: start immediately from apply).
  const rulesByClass = {};
  for (const r of affectedRules) {
    (rulesByClass[r.targetClassId] = rulesByClass[r.targetClassId] || []).push(r);
  }
  const blockedPackagesByClass = {};
  for (const cid of Object.keys(rulesByClass)) {
    blockedPackagesByClass[cid] =
      action === "start"
        ? autoBlockService.resolvePackagesFromRules(rulesByClass[cid])
        : [];
  }

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
  const studentClassMap = new Map();
  if (affectedClassIds.length > 0) {
    const students = await User.find({ role: "student", classId: { $in: affectedClassIds } }).select("_id classId");
    for (const s of students) {
      targetStudentIds.push(s._id);
      studentClassMap.set(s._id.toString(), s.classId);
    }
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

    // Per-class FCM multicast so every device gets the exact policy for its
    // own class in a single data message (the native handler saves it directly).
    const devicesWithFcm = await Device.find({
      userId: { $in: targetStudentIds },
      fcmToken: { $ne: null },
    }).select("userId fcmToken").lean();
    const tokensByClass = new Map();
    for (const d of devicesWithFcm) {
      if (!d.fcmToken) continue;
      const classId = studentClassMap.get(d.userId.toString());
      if (!classId) continue;
      if (!tokensByClass.has(classId)) tokensByClass.set(classId, []);
      tokensByClass.get(classId).push(d.fcmToken);
    }
    for (const [classId, tokens] of tokensByClass) {
      if (tokens.length === 0) continue;
      const payload = buildPolicyData(
        action,
        newStatus,
        blockedPackagesByClass[classId] || [],
        rulesByClass[classId] ? rulesByClass[classId][0] : null,
        serverTimestamp,
        { fcm: true, emergency: false }  // Explicitly set emergency: false for normal pause/start
      );
      fcmService
        .sendToMultipleDevices(tokens, payload)
        .catch(() => {});
    }

    // One restriction notification per student, replacing any prior unread one
    // (max one card per student, so repeated set/pause/resume never stacks).
    if (notify !== false && targetStudentIds.length > 0) {
      const Notification = require("../models/Notification");
      const actorLabel = await resolveActorLabel(actorId);
      const rule0 = affectedRules[0];
      const start = rule0?.scheduleStart || "09:00";
      const end   = rule0?.scheduleEnd   || "16:00";
      const fmt   = (t) => { const [h, m] = t.split(":"); const hr = parseInt(h, 10); return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`; };
      const reason = rule0?.reason;
      const title = action === "pause"
        ? "📴 Restriction Paused - Apps temporarily unblocked"
        : "▶️ Restriction Resumed";
      const message = action === "pause"
        ? `${actorLabel} paused class restrictions (${fmt(start)} – ${fmt(end)}). Apps are temporarily accessible.`
        : `${actorLabel} resumed class restrictions (${fmt(start)} – ${fmt(end)}). Restricted apps are now blocked.`;

      await Notification.deleteMany({
        studentId: { $in: targetStudentIds },
        type: "restriction",
        read: false,
      });

      await Notification.insertMany(
        targetStudentIds.map((sId) => ({
          studentId: sId,
          title,
          message,
          type: "restriction",
          read: false,
        }))
      );
    }
  }

  for (const cid of affectedClassIds) {
    const pData = buildPolicyData(
      action,
      newStatus,
      blockedPackagesByClass[cid] || [],
      rulesByClass[cid] ? rulesByClass[cid][0] : null,
      serverTimestamp
    );
    emitToClass(cid, "rule:update", {
      action,
      status: newStatus,
      ...pData,
    });
    emitToClass("ALL", "policy:updated", { classId: cid, action, status: newStatus, ...pData });
    emitToClass("ALL", "device:statusChanged", { classId: cid, action, status: newStatus });
  }

  logger.info(`Batch [${action}] applied to ${affectedRules.length} rules across ${affectedClassIds.length} classes.`);
  return { affectedRules: affectedRules.length, affectedClassIds };
};

async function dispatchRule(rule, action, { actorId = null, transition = action, notify = true } = {}) {
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

  // Broadcast using Socket class logic (socket carries a real array; FCM keeps
  // the JSON-string form since FCM data fields only accept string values).
  const resolvedPackages =
    action === "start" ? autoBlockService.resolvePackagesFromRules([rule.toObject()]) : [];
  const socketPolicyData = buildPolicyData(
    action,
    rule.status,
    resolvedPackages,
    rule.toObject(),
    serverTimestamp
  );
  const fcmPolicyData = buildPolicyData(
    action,
    rule.status,
    resolvedPackages,
    rule.toObject(),
    serverTimestamp,
    { fcm: true, emergency: false }  // Explicitly set emergency: false for normal pause/start
  );
  emitToClass(rule.targetClassId, "rule:update", {
    ruleId: rule._id,
    action,
    ...socketPolicyData,
  });
  emitToClass("ALL", "policy:updated", {
    classId: rule.targetClassId,
    ruleId: rule._id,
    action,
    ...socketPolicyData,
  });
  emitToClass("ALL", "device:statusChanged", {
    classId: rule.targetClassId,
    action,
    status: rule.status,
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
            ...fcmPolicyData,
            ruleId: rule._id.toString(),
          })
        )
      ).catch(() => {});
    }
  }

  if (notify && targetStudentIds.length > 0) {
    const Notification = require("../models/Notification");
    const actorLabel = await resolveActorLabel(actorId);
    const reason = rule.reason;
    const ruleObj = rule.toObject ? rule.toObject() : rule;
    const start   = ruleObj.scheduleStart || "09:00";
    const end     = ruleObj.scheduleEnd   || "16:00";
    const fmt     = (t) => { const [h, m] = t.split(":"); const hr = parseInt(h, 10); return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`; };
    const blockedCount = (action === "start" || transition === "resume") ? resolvedPackages.length : 0;
    const notificationTitle =
      transition === "resume"
        ? `▶️ Restriction Resumed - ${blockedCount} app${blockedCount !== 1 ? "s" : ""} blocked`
        : action === "start"
          ? `🔒 Restriction Started - ${blockedCount} app${blockedCount !== 1 ? "s" : ""} blocked`
          : action === "pause"
            ? "📴 Restriction Paused - Apps temporarily unblocked"
            : "✅ Restriction Stopped";
    const notificationMsg =
      action === "start" || transition === "resume"
        ? `${actorLabel} activated class restrictions (${fmt(start)} – ${fmt(end)}). ${blockedCount} restricted app${blockedCount !== 1 ? "s are" : " is"} now blocked.`
        : action === "pause"
          ? `${actorLabel} paused class restrictions (${fmt(start)} – ${fmt(end)}). Apps are temporarily accessible.`
          : reason
            ? `${actorLabel} stopped restrictions: ${reason}`
            : `${actorLabel} stopped class restrictions. All apps are accessible.`;

    // Stacking fix: replace any prior unread restriction card with the newest
    // state so the student list never accumulates duplicate restriction cards.
    await Notification.deleteMany({
      studentId: { $in: targetStudentIds },
      type: "restriction",
      read: false,
    });

    await Notification.insertMany(
      targetStudentIds.map((sId) => ({
        studentId: sId,
        title: notificationTitle,
        message: notificationMsg,
        type: "restriction",
        read: false,
      }))
    );
  }

  logger.info(`Dispatched scoped [${scopeType}] rule ${rule._id} [${action}] to ${targetDevices.length} devices and ${targetStudentIds.length} students.`);
}
