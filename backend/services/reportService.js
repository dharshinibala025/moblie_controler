const UsageLog = require("../models/UsageLog");
const User = require("../models/User");
const PDFDocument = require("pdfkit");
const { NotFoundError, ForbiddenError } = require("../utils/AppError");

exports.getDailyReport = async (classId, date, institutionId) => {
  if (institutionId) {
    const student = await User.findOne({ classId, role: "student", institutionId }).select("_id");
    if (!student) {
      throw new ForbiddenError("Access denied: class not in your institution");
    }
  }
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return generateReport(classId, startOfDay, endOfDay);
};

exports.getWeeklyReport = async (classId, startDate, institutionId) => {
  if (institutionId) {
    const student = await User.findOne({ classId, role: "student", institutionId }).select("_id");
    if (!student) {
      throw new ForbiddenError("Access denied: class not in your institution");
    }
  }
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return generateReport(classId, start, end);
};

exports.getStudentReport = async (studentId, startDate, endDate, institutionId) => {
  if (institutionId) {
    const student = await User.findOne({ _id: studentId, institutionId }).select("_id");
    if (!student) {
      throw new ForbiddenError("Access denied: student not in your institution");
    }
  }
  const start = startDate ? new Date(startDate) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const usageData = await UsageLog.aggregate([
    {
      $match: {
        studentId: require("mongoose").Types.ObjectId.createFromHexString(studentId),
        timestamp: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          packageName: "$packageName",
        },
        totalDurationMs: { $sum: "$durationMs" },
        sessions: { $sum: 1 },
        blockedAttempts: { $sum: { $cond: ["$wasBlockedAttempt", 1, 0] } },
      },
    },
    {
      $group: {
        _id: "$_id.date",
        totalUsageMs: { $sum: "$totalDurationMs" },
        totalBlockedAttempts: { $sum: "$blockedAttempts" },
        apps: {
          $push: {
            packageName: "$_id.packageName",
            totalDurationMs: "$totalDurationMs",
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return usageData;
};

async function generateReport(classId, startDate, endDate) {
  const students = await User.find({ classId, role: "student" }).select("_id name email");
  const studentIds = students.map((s) => s._id);

  const usageData = await UsageLog.aggregate([
    {
      $match: {
        studentId: { $in: studentIds },
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$studentId",
        totalUsageMs: { $sum: "$durationMs" },
        totalSessions: { $sum: 1 },
        blockedAttempts: { $sum: { $cond: ["$wasBlockedAttempt", 1, 0] } },
        uniqueApps: { $addToSet: "$packageName" },
      },
    },
  ]);

  const topApps = await UsageLog.aggregate([
    {
      $match: {
        studentId: { $in: studentIds },
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
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
    { $limit: 10 },
  ]);

  const studentMap = new Map(usageData.map((u) => [u._id.toString(), u]));

  const activeStudentIds = usageData
    .filter((u) => u.totalUsageMs > 0)
    .map((u) => u._id);

  const report = {
    classId,
    periodStart: startDate,
    periodEnd: endDate,
    totalStudents: students.length,
    activeStudents: activeStudentIds.length,
    totalUsageMs: usageData.reduce((sum, u) => sum + u.totalUsageMs, 0),
    topApps,
    blockedAttempts: usageData.reduce((sum, u) => sum + u.blockedAttempts, 0),
    students: students.map((s) => {
      const data = studentMap.get(s._id.toString());
      return {
        studentId: s._id,
        name: s.name,
        totalUsageMs: data ? data.totalUsageMs : 0,
        totalSessions: data ? data.totalSessions : 0,
        blockedAttempts: data ? data.blockedAttempts : 0,
      };
    }),
  };

  return report;
}

exports.getInstitutionOverview = async (institutionId, startDate, endDate) => {
  const classes = await User.distinct("classId", { institutionId, role: "student" });

  const reports = [];
  for (const classId of classes) {
    const report = await generateReport(
      classId,
      new Date(startDate),
      new Date(endDate)
    );
    reports.push(report);
  }

  return reports;
};

exports.generatePDF = async (classId, startDate, endDate) => {
  const report = await generateReport(classId, new Date(startDate), new Date(endDate));

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Smart Classroom Usage Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Class: ${classId}`);
    doc.text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text("Summary");
    doc.fontSize(11);
    doc.text(`Total Students: ${report.totalStudents}`);
    doc.text(`Active Students: ${report.activeStudents}`);
    doc.text(`Total Usage: ${(report.totalUsageMs / 3600000).toFixed(1)} hours`);
    doc.text(`Blocked Attempts: ${report.blockedAttempts}`);
    doc.moveDown();

    if (report.topApps.length > 0) {
      doc.fontSize(14).text("Top Apps");
      doc.fontSize(11);
      report.topApps.forEach((app, i) => {
        doc.text(
          `${i + 1}. ${app.packageName} — ${(app.totalDurationMs / 60000).toFixed(1)} min (${app.uniqueStudents} students)`
        );
      });
      doc.moveDown();
    }

    if (report.students.length > 0) {
      doc.fontSize(14).text("Student Usage");
      doc.fontSize(11);
      report.students.forEach((s) => {
        doc.text(
          `${s.name}: ${(s.totalUsageMs / 60000).toFixed(1)} min, ${s.blockedAttempts} blocked attempts`
        );
      });
    }

    doc.end();
  });
};
