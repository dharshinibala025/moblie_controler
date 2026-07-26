const ScannedApp = require("../models/ScannedApp");
const AppsCatalog = require("../models/AppsCatalog");
const Rule = require("../models/Rule");
const User = require("../models/User");
const logger = require("../utils/logger");
const { NotFoundError } = require("../utils/AppError");

exports.processScan = async (studentId, deviceId, apps) => {
  const student = await User.findById(studentId);
  if (!student) {
    throw new NotFoundError("Student");
  }

  await ScannedApp.deleteMany({ studentId, deviceId });

  const catalogEntries = await AppsCatalog.find({}).lean();
  const catalogMap = new Map(catalogEntries.map((e) => [e.packageName, e]));

  const scannedDocs = apps.map((app) => {
    const catalogMatch = catalogMap.get(app.packageName);
    return {
      studentId,
      deviceId,
      packageName: app.packageName,
      appName: app.appName,
      category: catalogMatch ? catalogMatch.category : "uncategorized",
      scannedAt: new Date(),
    };
  });

  await ScannedApp.insertMany(scannedDocs);

  const scopeQueries = [
    { targetClassId: student.classId },
    { "targetScope.type": "student", "targetScope.targetId": student._id.toString() },
    { "targetScope.type": "class", "targetScope.targetId": student.classId },
    { "targetScope.type": "institution", "targetScope.targetId": student.institutionId || "KSRCE" },
  ];

  if (student.departmentId) {
    scopeQueries.push({ "targetScope.type": "department", "targetScope.targetId": student.departmentId.toString() });
  }

  const activeRules = await Rule.find({
    $or: scopeQueries,
    status: "active",
  });

  const allBlockedApps = new Set();
  for (const rule of activeRules) {
    for (const pkg of rule.blockedApps) {
      allBlockedApps.add(pkg);
    }
  }

  const flaggedApps = apps
    .map((app) => app.packageName)
    .filter((pkg) => allBlockedApps.has(pkg));

  logger.info(`Scan processed for student ${studentId}: ${apps.length} apps, ${flaggedApps.length} flagged`);

  return {
    scannedCount: apps.length,
    flaggedApps,
  };
};

exports.getScannedAppsByStudent = async (studentId) => {
  return ScannedApp.find({ studentId }).sort({ scannedAt: -1 });
};

exports.getScannedAppsByClass = async (classId) => {
  const students = await User.find({ classId, role: "student" }).select("_id");
  const studentIds = students.map((s) => s._id);

  return ScannedApp.find({ studentId: { $in: studentIds } })
    .populate("studentId", "name email")
    .sort({ scannedAt: -1 });
};
