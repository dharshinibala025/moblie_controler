const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validation");
const ruleService = require("../services/ruleService");
const usageService = require("../services/usageService");
const reportService = require("../services/reportService");
const scanService = require("../services/scanService");
const auditService = require("../services/auditService");
const User = require("../models/User");
const Device = require("../models/Device");
const AppsCatalog = require("../models/AppsCatalog");
const logger = require("../utils/logger");

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
      { targetClassId: rule.targetClassId, blockedApps: rule.blockedApps }
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
    const rule = await ruleService.updateRule(req.params.id, req.body, req.user.userId);
    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "rule.update",
      { type: "rule", id: rule._id },
      req.body
    );
    res.json(rule);
  } catch (err) {
    next(err);
  }
});

router.post("/rules/:id/command", validate("commandBody"), async (req, res, next) => {
  try {
    const rule = await ruleService.sendCommand(
      req.params.id,
      req.body.action,
      req.user.userId
    );
    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "rule.command",
      { type: "rule", id: rule._id },
      { action: req.body.action }
    );
    res.json(rule);
  } catch (err) {
    next(err);
  }
});

router.get("/devices", async (req, res, next) => {
  try {
    const query = {};
    if (req.query.classId) {
      const students = await User.find({ classId: req.query.classId, role: "student" }).select("_id");
      query.userId = { $in: students.map((s) => s._id) };
    }
    const devices = await Device.find(query)
      .populate("userId", "name email classId")
      .sort({ lastSyncAt: -1 });
    res.json(devices);
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
    const report = await reportService.getDailyReport(classId, date || new Date());
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
    const report = await reportService.getWeeklyReport(classId, startDate);
    res.json(report);
  } catch (err) {
    next(err);
  }
});

router.get("/reports/student/:studentId", async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await reportService.getStudentReport(
      req.params.studentId,
      startDate,
      endDate
    );
    res.json(report);
  } catch (err) {
    next(err);
  }
});

router.get("/reports/overview", async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const institutionId = req.scopeInstitutionId || req.user.institutionId;
    const reports = await reportService.getInstitutionOverview(
      institutionId,
      startDate,
      endDate
    );
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

router.get("/reports/export", async (req, res, next) => {
  try {
    const { classId, format, startDate, endDate } = req.query;
    if (!classId) {
      return res.status(400).json({ error: "classId is required" });
    }

    if (format === "pdf") {
      const pdfBuffer = await reportService.generatePDF(
        classId,
        startDate || new Date(),
        endDate || new Date()
      );
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="usage-report-${classId}.pdf"`
      );
      res.send(pdfBuffer);
    } else {
      const report = await reportService.getDailyReport(
        classId,
        startDate || new Date()
      );
      res.json(report);
    }
  } catch (err) {
    next(err);
  }
});

router.get("/catalog", async (req, res, next) => {
  try {
    const query = {};
    if (req.query.category) query.category = req.query.category;
    const catalog = await AppsCatalog.find(query).sort({ packageName: 1 });
    res.json(catalog);
  } catch (err) {
    next(err);
  }
});

router.patch("/catalog/:packageName", validate("updateCatalog"), async (req, res, next) => {
  try {
    const catalog = await AppsCatalog.findOneAndUpdate(
      { packageName: req.params.packageName },
      req.body,
      { new: true, upsert: true }
    );
    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "catalog.update",
      { type: "catalog", id: catalog.packageName },
      req.body
    );
    res.json(catalog);
  } catch (err) {
    next(err);
  }
});

router.post("/staff", validate("registerStaff"), async (req, res, next) => {
  try {
    const { name, email, password, classId, institutionId } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const staff = await User.create({
      name,
      email,
      password,
      role: "staff",
      classId,
      institutionId: institutionId || req.scopeInstitutionId,
    });
    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "staff.create",
      { type: "user", id: staff._id },
      { name, email, classId }
    );
    res.status(201).json(staff);
  } catch (err) {
    next(err);
  }
});

router.get("/audit-log", async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.action) filters.action = req.query.action;
    if (req.scopeInstitutionId) filters.institutionId = req.scopeInstitutionId;
    const logs = await auditService.getAuditLog(filters);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
