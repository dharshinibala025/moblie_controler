const UsageLog = require("../models/UsageLog");
const Device = require("../models/Device");
const logger = require("../utils/logger");
const { ForbiddenError } = require("../utils/AppError");

exports.recordUsage = async (studentId, deviceId, logs) => {
  const device = await Device.findOne({ userId: studentId });
  if (!device) {
    throw new ForbiddenError("Device not registered");
  }

  if (device._id.toString() !== deviceId.toString() && deviceId.toString() !== device._id.toString()) {
    if (device._id.toString() !== String(deviceId)) {
      throw new ForbiddenError("Device mismatch");
    }
  }

  const usageDocs = logs.map((log) => ({
    studentId,
    deviceId: device._id,
    packageName: log.packageName,
    durationMs: log.durationMs,
    wasBlockedAttempt: log.wasBlockedAttempt || false,
    timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
  }));

  const result = await UsageLog.insertMany(usageDocs);

  device.lastSyncAt = new Date();
  await device.save();

  logger.info(`Usage recorded: ${logs.length} entries for student ${studentId}`);

  return { recordedCount: result.length };
};

exports.getUsageByStudent = async (studentId, startDate, endDate) => {
  const query = { studentId };
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return UsageLog.find(query).sort({ timestamp: -1 });
};

exports.getUsageByClass = async (classId, startDate, endDate) => {
  const User = require("../models/User");
  const students = await User.find({ classId, role: "student" }).select("_id");
  const studentIds = students.map((s) => s._id);

  const matchStage = { studentId: { $in: studentIds } };
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }

  return UsageLog.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          studentId: "$studentId",
          packageName: "$packageName",
        },
        totalDurationMs: { $sum: "$durationMs" },
        totalSessions: { $sum: 1 },
        blockedAttempts: { $sum: { $cond: ["$wasBlockedAttempt", 1, 0] } },
      },
    },
    {
      $group: {
        _id: "$_id.studentId",
        totalUsageMs: { $sum: "$totalDurationMs" },
        appBreakdown: {
          $push: {
            packageName: "$_id.packageName",
            totalDurationMs: "$totalDurationMs",
            totalSessions: "$totalSessions",
            blockedAttempts: "$blockedAttempts",
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: "$student" },
    {
      $project: {
        studentId: "$_id",
        studentName: "$student.name",
        totalUsageMs: 1,
        appBreakdown: 1,
      },
    },
  ]);
};

exports.getTopApps = async (classId, startDate, endDate, limit = 5) => {
  const User = require("../models/User");
  const students = await User.find({ classId, role: "student" }).select("_id");
  const studentIds = students.map((s) => s._id);

  const matchStage = { studentId: { $in: studentIds } };
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }

  return UsageLog.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$packageName",
        totalDurationMs: { $sum: "$durationMs" },
        uniqueStudents: { $addToSet: "$studentId" },
      },
    },
    {
      $project: {
        packageName: "$_id",
        totalDurationMs: 1,
        uniqueStudents: { $size: "$uniqueStudents" },
      },
    },
    { $sort: { totalDurationMs: -1 } },
    { $limit: limit },
  ]);
};
