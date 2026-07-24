const cron = require("cron");
const ReportsCache = require("../models/ReportsCache");
const UsageLog = require("../models/UsageLog");
const User = require("../models/User");
const logger = require("../utils/logger");

const aggregateDailyReports = async () => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setDate(startOfDay.getDate() - 1);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const classes = await User.distinct("classId", { role: "student", classId: { $ne: null } });

    for (const classId of classes) {
      if (!classId) continue;

      const students = await User.find({ classId, role: "student" }).select("_id");
      const studentIds = students.map((s) => s._id);

      if (studentIds.length === 0) continue;

      const usageData = await UsageLog.aggregate([
        {
          $match: {
            studentId: { $in: studentIds },
            timestamp: { $gte: startOfDay, $lte: endOfDay },
          },
        },
        {
          $group: {
            _id: null,
            totalUsageMs: { $sum: "$durationMs" },
            activeStudents: { $addToSet: "$studentId" },
            blockedAttempts: { $sum: { $cond: ["$wasBlockedAttempt", 1, 0] } },
            appData: {
              $push: {
                packageName: "$packageName",
                durationMs: "$durationMs",
                studentId: "$studentId",
              },
            },
          },
        },
      ]);

      if (usageData.length === 0) continue;

      const data = usageData[0];

      const appMap = {};
      for (const entry of data.appData) {
        if (!appMap[entry.packageName]) {
          appMap[entry.packageName] = {
            packageName: entry.packageName,
            totalDurationMs: 0,
            students: new Set(),
          };
        }
        appMap[entry.packageName].totalDurationMs += entry.durationMs;
        appMap[entry.packageName].students.add(entry.studentId.toString());
      }

      const topApps = Object.values(appMap)
        .map((app) => ({
          packageName: app.packageName,
          totalDurationMs: app.totalDurationMs,
          uniqueStudents: app.students.size,
        }))
        .sort((a, b) => b.totalDurationMs - a.totalDurationMs)
        .slice(0, 10);

      await ReportsCache.findOneAndUpdate(
        {
          classId,
          periodType: "daily",
          periodStart: startOfDay,
        },
        {
          classId,
          institutionId: students[0]?.institutionId || null,
          periodType: "daily",
          periodStart: startOfDay,
          periodEnd: endOfDay,
          totalStudents: students.length,
          activeStudents: data.activeStudents.length,
          totalUsageMs: data.totalUsageMs,
          topApps,
          blockedAttempts: data.blockedAttempts,
        },
        { upsert: true, new: true }
      );

      logger.debug(`Daily report aggregated for class ${classId}`);
    }

    logger.info(`Daily report aggregation complete for ${classes.length} classes`);
  } catch (err) {
    logger.error(`Daily report aggregation error: ${err.message}`);
  }
};

const aggregateWeeklyReports = async () => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(now);
  endOfWeek.setHours(23, 59, 59, 999);

  try {
    const classes = await User.distinct("classId", { role: "student", classId: { $ne: null } });

    for (const classId of classes) {
      if (!classId) continue;

      const students = await User.find({ classId, role: "student" }).select("_id");
      const studentIds = students.map((s) => s._id);

      if (studentIds.length === 0) continue;

      const usageData = await UsageLog.aggregate([
        {
          $match: {
            studentId: { $in: studentIds },
            timestamp: { $gte: startOfWeek, $lte: endOfWeek },
          },
        },
        {
          $group: {
            _id: null,
            totalUsageMs: { $sum: "$durationMs" },
            activeStudents: { $addToSet: "$studentId" },
            blockedAttempts: { $sum: { $cond: ["$wasBlockedAttempt", 1, 0] } },
            appData: {
              $push: {
                packageName: "$packageName",
                durationMs: "$durationMs",
                studentId: "$studentId",
              },
            },
          },
        },
      ]);

      if (usageData.length === 0) continue;

      const data = usageData[0];

      const appMap = {};
      for (const entry of data.appData) {
        if (!appMap[entry.packageName]) {
          appMap[entry.packageName] = {
            packageName: entry.packageName,
            totalDurationMs: 0,
            students: new Set(),
          };
        }
        appMap[entry.packageName].totalDurationMs += entry.durationMs;
        appMap[entry.packageName].students.add(entry.studentId.toString());
      }

      const topApps = Object.values(appMap)
        .map((app) => ({
          packageName: app.packageName,
          totalDurationMs: app.totalDurationMs,
          uniqueStudents: app.students.size,
        }))
        .sort((a, b) => b.totalDurationMs - a.totalDurationMs)
        .slice(0, 10);

      await ReportsCache.findOneAndUpdate(
        {
          classId,
          periodType: "weekly",
          periodStart: startOfWeek,
        },
        {
          classId,
          institutionId: students[0]?.institutionId || null,
          periodType: "weekly",
          periodStart: startOfWeek,
          periodEnd: endOfWeek,
          totalStudents: students.length,
          activeStudents: data.activeStudents.length,
          totalUsageMs: data.totalUsageMs,
          topApps,
          blockedAttempts: data.blockedAttempts,
        },
        { upsert: true, new: true }
      );

      logger.debug(`Weekly report aggregated for class ${classId}`);
    }

    logger.info(`Weekly report aggregation complete for ${classes.length} classes`);
  } catch (err) {
    logger.error(`Weekly report aggregation error: ${err.message}`);
  }
};

const startScheduler = () => {
  const dailyJob = new cron.CronJob("0 1 * * *", aggregateDailyReports, null, false, "UTC");
  dailyJob.start();
  logger.info("Daily report aggregation scheduled at 01:00 UTC");

  const weeklyJob = new cron.CronJob("0 2 * * 0", aggregateWeeklyReports, null, false, "UTC");
  weeklyJob.start();
  logger.info("Weekly report aggregation scheduled at Sunday 02:00 UTC");
};

module.exports = { startScheduler, aggregateDailyReports, aggregateWeeklyReports };
