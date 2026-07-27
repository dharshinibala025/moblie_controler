const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validation");
const { strictLimiter } = require("../middleware/rateLimiter");
const authService = require("../services/authService");
const ruleService = require("../services/ruleService");
const reportService = require("../services/reportService");
const auditService = require("../services/auditService");
const deviceService = require("../services/deviceService");
const catalogService = require("../services/catalogService");
const { getIO, emitToUser } = require("../config/socket");
const fcmService = require("../services/fcmService");
const User = require("../models/User");
const Department = require("../models/Department");
const AcademicYear = require("../models/AcademicYear");
const Section = require("../models/Section");
const ClassRoom = require("../models/ClassRoom");
const StaffAssignment = require("../models/StaffAssignment");
const Device = require("../models/Device");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("admin"));

const checkScope = (req, res, next) => {
  if (req.user.institutionId) {
    req.scopeInstitutionId = req.user.institutionId;
  }
  next();
};

router.use(checkScope);

const emailService = require("../services/emailService");

// ========== USER MANAGEMENT ==========

router.post("/users/student", validate("createStudent"), async (req, res, next) => {
  try {
    const { name, email, studentId, classId, tempPassword } = req.body;
    const result = await authService.createStudent({
      name,
      email,
      studentId,
      classId,
      tempPassword,
      createdBy: req.user.userId,
    });
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    await emailService.sendTemporaryPasswordEmail({
      toEmail: email,
      name,
      tempPassword,
      role: "student",
    });
    res.status(201).json({ user: result.user });
  } catch (err) {
    next(err);
  }
});

router.post("/users/staff", validate("createStaff"), async (req, res, next) => {
  try {
    const { name, email, employeeId, classIds, tempPassword } = req.body;
    const result = await authService.createStaff({
      name,
      email,
      employeeId,
      classIds,
      tempPassword,
      createdBy: req.user.userId,
    });
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    await emailService.sendTemporaryPasswordEmail({
      toEmail: email,
      name,
      tempPassword,
      role: "staff",
    });

    if (classIds && classIds.length > 0) {
      for (const classId of classIds) {
        await StaffAssignment.findOneAndUpdate(
          { staffId: result.user._id, classId },
          { staffId: result.user._id, classId, institutionId: "KSRCE", assignedBy: req.user.userId, isActive: true },
          { upsert: true, new: true }
        );
      }
    }

    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "staff.create",
      { type: "user", id: result.user._id },
      { email, employeeId, classIds },
      req.scopeInstitutionId || result.user.institutionId
    );

    res.status(201).json({ user: result.user });
  } catch (err) {
    next(err);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const { role, status, classId, page, limit } = req.query;
    const result = await authService.listUsers({
      role,
      status,
      classId,
      page,
      limit,
      institutionId: req.scopeInstitutionId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.get("/users/:id/sessions", async (req, res, next) => {
  try {
    const sessions = await authService.getUserSessions(req.params.id);
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

router.post("/users/:id/force-offline", validate("forceOffline"), async (req, res, next) => {
  try {
    const result = await authService.forceOffline(req.params.id, req.user.userId);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }

    emitToUser(req.params.id, "session:revoked", {
      message: "Your session has been revoked by administrator",
      reason: req.body.reason || "Force offline",
    });

    if (result.fcmToken) {
      await fcmService.sendToDevice(result.fcmToken, {
        type: "force_logout",
        reason: req.body.reason || "Session revoked by administrator",
      });
    }

    res.json({
      message: "User forced offline",
      sessionsRevoked: result.sessionsRevoked,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/users/:id/suspend", validate("suspendUser"), async (req, res, next) => {
  try {
    const result = await authService.suspendUser(req.params.id, req.user.userId);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }

    emitToUser(req.params.id, "session:revoked", {
      message: "Your account has been suspended",
      reason: req.body.reason || "Suspended by administrator",
    });

    const device = await Device.findOne({ userId: req.params.id });
    if (device && device.fcmToken) {
      await fcmService.sendToDevice(device.fcmToken, {
        type: "force_logout",
        reason: "Account suspended",
      });
    }

    res.json({ message: `User ${result.user.status}`, user: result.user });
  } catch (err) {
    next(err);
  }
});

router.post("/users/:id/disable", async (req, res, next) => {
  try {
    const result = await authService.disableUser(req.params.id, req.user.userId);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json({ message: "User disabled", user: result.user });
  } catch (err) {
    next(err);
  }
});

router.post("/users/:id/reactivate", async (req, res, next) => {
  try {
    const result = await authService.reactivateUser(req.params.id, req.user.userId);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json({ message: "User reactivated", user: result.user });
  } catch (err) {
    next(err);
  }
});

// ========== HIERARCHY MANAGEMENT ==========

router.post("/departments", validate("createDepartment"), async (req, res, next) => {
  try {
    const { name, code, institutionId } = req.body;
    const existing = await Department.findOne({ code: code.toUpperCase(), institutionId });
    if (existing) {
      return res.status(409).json({ error: "Department code already exists" });
    }
    const dept = await Department.create({ name, code: code.toUpperCase(), institutionId });
    res.status(201).json(dept);
  } catch (err) {
    next(err);
  }
});

router.get("/departments", async (req, res, next) => {
  try {
    const query = { institutionId: req.scopeInstitutionId };
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === "true";
    const departments = await Department.find(query).sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    next(err);
  }
});

router.post("/academic-years", validate("createAcademicYear"), async (req, res, next) => {
  try {
    const { name, startDate, endDate, institutionId } = req.body;
    const existing = await AcademicYear.findOne({ name, institutionId });
    if (existing) {
      return res.status(409).json({ error: "Academic year already exists" });
    }
    const year = await AcademicYear.create({ name, startDate, endDate, institutionId });
    res.status(201).json(year);
  } catch (err) {
    next(err);
  }
});

router.get("/academic-years", async (req, res, next) => {
  try {
    const query = { institutionId: req.scopeInstitutionId };
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === "true";
    const years = await AcademicYear.find(query).sort({ startDate: -1 });
    res.json(years);
  } catch (err) {
    next(err);
  }
});

router.post("/sections", validate("createSection"), async (req, res, next) => {
  try {
    const { name, departmentId, academicYearId, institutionId } = req.body;
    const existing = await Section.findOne({ name, departmentId, academicYearId });
    if (existing) {
      return res.status(409).json({ error: "Section already exists for this department and year" });
    }
    const section = await Section.create({ name, departmentId, academicYearId, institutionId });
    res.status(201).json(section);
  } catch (err) {
    next(err);
  }
});

router.get("/sections", async (req, res, next) => {
  try {
    const query = { institutionId: req.scopeInstitutionId };
    if (req.query.departmentId) query.departmentId = req.query.departmentId;
    if (req.query.academicYearId) query.academicYearId = req.query.academicYearId;
    const sections = await Section.find(query)
      .populate("departmentId", "name code")
      .populate("academicYearId", "name")
      .sort({ name: 1 });
    res.json(sections);
  } catch (err) {
    next(err);
  }
});

router.post("/classes", validate("createClassRoom"), async (req, res, next) => {
  try {
    const { name, code, departmentId, sectionId, academicYearId, institutionId } = req.body;
    const existing = await ClassRoom.findOne({ code: code.toUpperCase(), institutionId });
    if (existing) {
      return res.status(409).json({ error: "Class code already exists" });
    }
    const classroom = await ClassRoom.create({
      name,
      code: code.toUpperCase(),
      departmentId,
      sectionId,
      academicYearId,
      institutionId,
    });
    res.status(201).json(classroom);
  } catch (err) {
    next(err);
  }
});

router.get("/classes", async (req, res, next) => {
  try {
    const query = { institutionId: req.scopeInstitutionId };
    if (req.query.departmentId) query.departmentId = req.query.departmentId;
    if (req.query.sectionId) query.sectionId = req.query.sectionId;
    if (req.query.academicYearId) query.academicYearId = req.query.academicYearId;
    const classes = await ClassRoom.find(query)
      .populate("departmentId", "name code")
      .populate("sectionId", "name")
      .populate("academicYearId", "name")
      .sort({ name: 1 });
    res.json(classes);
  } catch (err) {
    next(err);
  }
});

// ========== STAFF ASSIGNMENTS ==========

router.post("/staff-assignments", validate("assignStaff"), async (req, res, next) => {
  try {
    const { staffId, classIds } = req.body;

    const staff = await User.findById(staffId);
    if (!staff || staff.role !== "staff") {
      return res.status(404).json({ error: "Staff not found" });
    }

    const assignments = [];
    for (const classId of classIds) {
      const assignment = await StaffAssignment.findOneAndUpdate(
        { staffId, classId },
        { staffId, classId, institutionId: req.scopeInstitutionId, assignedBy: req.user.userId, isActive: true },
        { upsert: true, new: true }
      );
      assignments.push(assignment);
    }

    res.status(201).json({ assignments });
  } catch (err) {
    next(err);
  }
});

router.get("/staff-assignments", async (req, res, next) => {
  try {
    const query = { institutionId: req.scopeInstitutionId, isActive: true };
    if (req.query.staffId) query.staffId = req.query.staffId;
    if (req.query.classId) query.classId = req.query.classId;
    const assignments = await StaffAssignment.find(query)
      .populate("staffId", "name email employeeId")
      .populate("classId", "name code")
      .sort({ assignedAt: -1 });
    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

router.delete("/staff-assignments/:id", async (req, res, next) => {
  try {
    const assignment = await StaffAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    assignment.isActive = false;
    await assignment.save();
    res.json({ message: "Assignment removed" });
  } catch (err) {
    next(err);
  }
});

// ========== CATALOG ROUTES ==========

router.get("/catalog", async (req, res, next) => {
  try {
    const AppsCatalog = require("../models/AppsCatalog");
    const query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.isDangerous !== undefined) query.isDangerous = req.query.isDangerous === "true";
    const catalog = await AppsCatalog.find(query).sort({ appName: 1 });
    res.json(catalog);
  } catch (err) {
    next(err);
  }
});

router.patch("/catalog/:packageName", validate("updateCatalog"), async (req, res, next) => {
  try {
    const AppsCatalog = require("../models/AppsCatalog");
    const app = await AppsCatalog.findOneAndUpdate(
      { packageName: req.params.packageName },
      { $set: req.body },
      { new: true }
    );
    if (!app) {
      return res.status(404).json({ error: "App not found in catalog" });
    }
    res.json(app);
  } catch (err) {
    next(err);
  }
});

// ========== STAFF ALIAS ROUTE ==========
// Simplified staff creation endpoint (accepts name, email, password, classId)

router.post("/staff", async (req, res, next) => {
  try {
    const { name, email, password, classId } = req.body;

    if (!name || !email || !password || !classId) {
      return res.status(400).json({ error: "Validation failed", details: ["name, email, password, classId are required"] });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Validation failed", details: ["Invalid email address"] });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Validation failed", details: ["Password must be at least 8 characters"] });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "A user with this email already exists" });
    }

    const newStaff = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: "staff",
      classId,
      institutionId: req.scopeInstitutionId || "KSRCE",
      isActive: true,
      status: "active",
    });

    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "staff.create",
      { type: "user", id: newStaff._id },
      { email, classId },
      req.scopeInstitutionId || "KSRCE"
    );

    const staffObj = newStaff.toObject();
    delete staffObj.password;
    res.status(201).json(staffObj);
  } catch (err) {
    next(err);
  }
});

// ========== EXISTING ROUTES ==========

router.post("/rules", validate("createRule"), async (req, res, next) => {
  try {
    if (req.scopeInstitutionId) {
      req.body.institutionId = req.scopeInstitutionId;
    }
    const rule = await ruleService.createRule(req.body, req.user.userId);
    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "rule.create",
      { type: "rule", id: rule._id },
      { targetClassId: rule.targetClassId },
      req.scopeInstitutionId || rule.institutionId
    );
    res.status(201).json(rule);
  } catch (err) {
    next(err);
  }
});

router.get("/rules", async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.targetClassId) filters.targetClassId = req.query.targetClassId;
    if (req.query.status) filters.status = req.query.status;
    if (req.scopeInstitutionId) filters.institutionId = req.scopeInstitutionId;
    const rules = await ruleService.getRules(filters);
    res.json(rules);
  } catch (err) {
    next(err);
  }
});

router.patch("/rules/:id", validate("updateRule"), async (req, res, next) => {
  try {
    const rule = await ruleService.updateRule(req.params.id, req.body, req.user.userId, req.scopeInstitutionId);
    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "rule.update",
      { type: "rule", id: rule._id },
      { targetClassId: rule.targetClassId },
      req.scopeInstitutionId || rule.institutionId
    );
    res.json(rule);
  } catch (err) {
    next(err);
  }
});

router.post("/rules/:id/command", validate("commandBody"), async (req, res, next) => {
  try {
    const { action } = req.body;
    const rule = await ruleService.sendCommand(req.params.id, action, req.user.userId, req.scopeInstitutionId);
    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "rule.command",
      { type: "rule", id: rule._id },
      { action, targetClassId: rule.targetClassId },
      req.scopeInstitutionId || rule.institutionId
    );
    res.json(rule);
  } catch (err) {
    next(err);
  }
});

router.get("/devices", async (req, res, next) => {
  try {
    const devices = await deviceService.getDevices(req.query.classId, req.scopeInstitutionId);
    res.json(devices);
  } catch (err) {
    next(err);
  }
});

router.get("/reports/overview", async (req, res, next) => {
  try {
    const institutionId = req.scopeInstitutionId || req.user.institutionId;
    const endDate = req.query.endDate || new Date().toISOString();
    const startDate = req.query.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const reports = await reportService.getInstitutionOverview(institutionId, startDate, endDate);
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

router.get("/reports/daily", async (req, res, next) => {
  try {
    const { classId, date } = req.query;
    if (!classId) {
      return res.status(400).json({ error: "classId is required" });
    }
    const report = await reportService.getDailyReport(
      classId,
      date || new Date().toISOString(),
      req.scopeInstitutionId
    );
    res.json(report);
  } catch (err) {
    next(err);
  }
});

router.get("/reports/weekly", async (req, res, next) => {
  try {
    const { classId, startDate } = req.query;
    if (!classId) {
      return res.status(400).json({ error: "classId is required" });
    }
    const report = await reportService.getWeeklyReport(
      classId,
      startDate || new Date().toISOString(),
      req.scopeInstitutionId
    );
    res.json(report);
  } catch (err) {
    next(err);
  }
});

router.get("/reports/student/:id", async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await reportService.getStudentReport(
      req.params.id,
      startDate,
      endDate,
      req.scopeInstitutionId
    );
    res.json(report);
  } catch (err) {
    next(err);
  }
});

router.get("/reports/export", async (req, res, next) => {
  try {
    const { classId, format = "json", startDate, endDate } = req.query;
    if (!classId) {
      return res.status(400).json({ error: "classId is required" });
    }

    const report = await reportService.getDailyReport(
      classId,
      startDate || new Date().toISOString(),
      req.scopeInstitutionId
    );

    if (format === "pdf") {
      const doc = new (require("pdfkit"))();
      res.setHeader("Content-Type", "application/pdf");
      doc.pipe(res);
      doc.fontSize(16).text(`Class Report — ${classId}`, { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Total Students: ${report.totalStudents}`);
      doc.moveDown();
      doc.text("Top Blocked Apps:");
      for (const app of report.topApps || []) {
        doc.text(`  ${app.appName || app.packageName}: ${app.count} blocks`);
      }
      doc.end();
    } else {
      res.json({ ...report, classId });
    }
  } catch (err) {
    next(err);
  }
});

router.get("/audit-log", async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.action) filters.action = req.query.action;
    if (req.scopeInstitutionId) filters.institutionId = req.scopeInstitutionId;
    if (req.query.page) filters.page = req.query.page;
    if (req.query.limit) filters.limit = req.query.limit;
    const result = await auditService.getAuditLog(filters);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/scanned-apps", async (req, res, next) => {
  try {
    const ScannedApp = require("../models/ScannedApp");
    const query = {};

    if (req.query.studentId) {
      query.studentId = req.query.studentId;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.search) {
      query.$or = [
        { appName: { $regex: req.query.search, $options: "i" } },
        { packageName: { $regex: req.query.search, $options: "i" } },
      ];
    }

    let apps = await ScannedApp.find(query)
      .populate("studentId", "name email studentId classId")
      .sort({ scannedAt: -1 });

    if (req.query.classId) {
      apps = apps.filter((app) => app.studentId && app.studentId.classId === req.query.classId);
    }

    res.json({ apps });
  } catch (err) {
    next(err);
  }
});

router.get("/students/:id/social-apps", async (req, res, next) => {
  try {
    const ScannedApp = require("../models/ScannedApp");
    const Device = require("../models/Device");
    const Rule = require("../models/Rule");
    const User = require("../models/User");

    const studentId = req.params.id;
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const device = await Device.findOne({ userId: studentId }).sort({ updatedAt: -1 });
    const deviceId = device ? device._id : null;
    const lastSyncAt = device ? device.lastSyncAt : null;

    const activeRules = await Rule.find({
      $or: [
        { targetClassId: student.classId },
        { "targetScope.type": "student", "targetScope.targetId": student._id.toString() },
        { "targetScope.type": "class", "targetScope.targetId": student.classId },
        { "targetScope.type": "institution", "targetScope.targetId": student.institutionId || "KSRCE" },
        ...(student.departmentId ? [{ "targetScope.type": "department", "targetScope.targetId": student.departmentId.toString() }] : []),
        ...(student.academicYearId ? [{ "targetScope.type": "year", "targetScope.targetId": student.academicYearId.toString() }] : []),
      ],
      status: "active",
    });

    const blockedAppsSet = new Set();
    let maxPolicyVersion = 0;
    activeRules.forEach((rule) => {
      maxPolicyVersion = Math.max(maxPolicyVersion, rule.policyVersion || 1);
      rule.blockedApps.forEach((app) => blockedAppsSet.add(app));
    });

    const query = { studentId, removedAt: null };
    const { category, search, sort } = req.query;

    if (category) {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { appName: { $regex: search, $options: "i" } },
        { packageName: { $regex: search, $options: "i" } },
      ];
    }

    let appsQuery = ScannedApp.find(query);

    if (sort === "name") {
      appsQuery = appsQuery.sort({ appName: 1 });
    } else if (sort === "installed") {
      appsQuery = appsQuery.sort({ createdAt: 1 });
    } else {
      appsQuery = appsQuery.sort({ appName: 1 });
    }

    const scannedApps = await appsQuery;
    const lastScanAt = scannedApps.length > 0 ? scannedApps[0].scannedAt : null;

    const appsList = scannedApps.map((app) => {
      const isBlocked = blockedAppsSet.has(app.packageName);
      return {
        packageName: app.packageName,
        appName: app.appName,
        iconCategory: app.category || "social",
        installedAt: app.createdAt,
        lastUpdatedAt: app.updatedAt,
        restrictionStatus: isBlocked ? "restricted" : "allowed",
        policyVersion: isBlocked ? maxPolicyVersion : 0,
        lastSyncAt,
      };
    });

    res.json({
      studentId,
      deviceId,
      lastScanAt,
      apps: appsList,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/reports/blocked-attempts", async (req, res, next) => {
  try {
    const BlockedAttempt = require("../models/BlockedAttempt");
    const query = {};

    if (req.query.studentId) {
      query.studentId = req.query.studentId;
    }
    if (req.query.packageName) {
      query.packageName = req.query.packageName;
    }

    const attempts = await BlockedAttempt.find(query)
      .populate("studentId", "name email studentId classId")
      .populate("deviceId", "deviceInfo")
      .sort({ attemptedAt: -1 })
      .limit(100);

    res.json({ attempts });
  } catch (err) {
    next(err);
  }
});

router.post("/notifications/broadcast", async (req, res, next) => {
  try {
    const { title, message, targetClassId, type = "general" } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Notification message is required" });
    }

    const Notification = require("../models/Notification");
    const User = require("../models/User");

    const query = { role: "student", status: "active" };
    if (targetClassId) {
      query.classId = targetClassId;
    }
    if (req.scopeInstitutionId) {
      query.institutionId = req.scopeInstitutionId;
    }

    const students = await User.find(query);

    if (students.length === 0) {
      return res.status(404).json({ error: "No active students found for broadcast" });
    }

    const notificationsToCreate = students.map((s) => ({
      studentId: s._id,
      title: title || "Department HOD / Admin Instruction",
      message: message,
      type: type || "general",
      read: false,
    }));

    await Notification.insertMany(notificationsToCreate);

    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "notification_broadcast",
      { type: "class", id: targetClassId || "ALL" },
      { title, message, studentCount: students.length },
      req.scopeInstitutionId
    );

    res.status(201).json({
      success: true,
      message: `Broadcast instruction sent to ${students.length} student(s)`,
      count: students.length,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
