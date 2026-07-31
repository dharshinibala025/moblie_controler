const ScannedApp = require("../models/ScannedApp");
const AppsCatalog = require("../models/AppsCatalog");
const ScanHistory = require("../models/ScanHistory");
const Rule = require("../models/Rule");
const User = require("../models/User");
const logger = require("../utils/logger");
const { NotFoundError } = require("../utils/AppError");

exports.processScan = async (studentId, deviceId, apps) => {
  const student = await User.findById(studentId);
  if (!student) {
    throw new NotFoundError("Student");
  }

  // 1. Fetch active restriction rules for this student
  const scopeQueries = [
    { targetClassId: student.classId },
    { "targetScope.type": "student", "targetScope.targetId": student._id.toString() },
    { "targetScope.type": "class", "targetScope.targetId": student.classId },
    { "targetScope.type": "institution", "targetScope.targetId": student.institutionId || "KSRCE" },
  ];

  if (student.departmentId) {
    scopeQueries.push({
      "targetScope.type": "department",
      "targetScope.targetId": student.departmentId.toString(),
    });
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

  // 2. Fetch matching catalog entries for the scanned apps
  const packageNames = apps.map((app) => app.packageName);
  const catalogEntries = await AppsCatalog.find({ packageName: { $in: packageNames } });
  const catalogMap = new Map(catalogEntries.map((e) => [e.packageName, e]));

  const catalogService = require("./catalogService");

  // 3. Auto-create registry entries for new, unrecognized packages
  const missingApps = [];
  for (const app of apps) {
    if (!catalogMap.has(app.packageName)) {
      const isSocial = catalogService.isSocialMediaPackage(app.packageName, app.appName);
      missingApps.push({
        packageName: app.packageName,
        appName: app.appName,
        category: isSocial ? "social" : "uncategorized",
        isSocialMedia: isSocial,
        active: true,
      });
    }
  }

  if (missingApps.length > 0) {
    try {
      await AppsCatalog.insertMany(missingApps, { ordered: false });
    } catch (e) {
      // Ignore duplicate key errors from concurrent writes
    }
    // Refresh catalog mapping
    const newCatalogEntries = await AppsCatalog.find({ packageName: { $in: packageNames } });
    for (const e of newCatalogEntries) {
      catalogMap.set(e.packageName, e);
    }
  }

  // 4. Determine social media applications (from registry or blocked by active rules)
  const socialApps = apps.filter((app) => {
    const catalogItem = catalogMap.get(app.packageName);
    const isRegisteredSocial = catalogItem && catalogItem.isSocialMedia;
    const isBlockedByPolicy = allBlockedApps.has(app.packageName);
    return isRegisteredSocial || isBlockedByPolicy;
  });

  const rawAppCount = apps.length;
  const socialAppCount = socialApps.length;

  // 5. Log scan history
  await ScanHistory.create({
    studentId,
    deviceId,
    rawAppCount,
    socialAppCount,
  });

  // 6. Update soft-delete status for removed applications
  const currentlySavedApps = await ScannedApp.find({ studentId, deviceId, removedAt: null });
  const incomingPackageNames = new Set(apps.map((a) => a.packageName));

  const appsToRemove = currentlySavedApps.filter((app) => !incomingPackageNames.has(app.packageName));
  if (appsToRemove.length > 0) {
    const removeIds = appsToRemove.map((app) => app._id);
    await ScannedApp.updateMany({ _id: { $in: removeIds } }, { $set: { removedAt: new Date() } });
  }

  // 7. Upsert and restore all scanned applications
  for (const app of apps) {
    const catalogMatch = catalogMap.get(app.packageName);
    await ScannedApp.findOneAndUpdate(
      { studentId, deviceId, packageName: app.packageName },
      {
        $set: {
          appName: app.appName,
          category: catalogMatch ? catalogMatch.category : "utilities",
          versionName: app.versionName || "1.0.0",
          isSystemApp: app.isSystemApp || false,
          isUserFacing: true,
          removedAt: null,
        },
      },
      { upsert: true, new: true }
    );
  }

  // 8. Flag apps blocked by active policies
  const flaggedApps = apps
    .map((app) => app.packageName)
    .filter((pkg) => allBlockedApps.has(pkg));

  logger.info(`Scan processed for student ${studentId}: ${rawAppCount} apps, ${socialAppCount} social, ${flaggedApps.length} flagged`);

  return {
    scannedCount: rawAppCount,
    socialAppCount,
    flaggedApps,
  };
};

exports.getScannedAppsByStudent = async (studentId) => {
  return ScannedApp.find({ studentId, removedAt: null }).sort({ appName: 1 });
};

exports.getScannedAppsByClass = async (classId) => {
  const students = await User.find({ classId, role: "student" }).select("_id");
  const studentIds = students.map((s) => s._id);

  return ScannedApp.find({ studentId: { $in: studentIds }, removedAt: null })
    .populate("studentId", "name email")
    .sort({ scannedAt: -1 });
};
