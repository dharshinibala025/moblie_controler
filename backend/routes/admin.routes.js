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

    if (classIds && classIds.length > 0) {
      for (const classId of classIds) {
        await StaffAssignment.findOneAndUpdate(
          { staffId: result.user._id, classId },
          { staffId: result.user._id, classId, institutionId: "KSRCE", assignedBy: req.user.userId, isActive: true },
          { upsert: true, new: true }
        );
      }
    }

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

// ========== EXISTING ROUTES ==========

router.post("/rules", validate("createRule"), async (req, res, next) => {
  try {
    if (req.scopeInstitutionId) {
      req.body.institutionId = req.scopeInstitutionId;
    }
    const rule = await ruleService.createRule(req.body, req.user.userId);
    await auditService.logAction(req.user.userId, req.user.role, "rule.create", { type: "rule", id: rule._id }, { targetClassId: rule.targetClassId });
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
    const reports = await reportService.getInstitutionOverview(institutionId, req.query.startDate, req.query.endDate);
    res.json(reports);
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

module.exports = router;
