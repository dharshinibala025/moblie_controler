const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const classService = require("../services/classService");
const ruleService = require("../services/ruleService");
const auditService = require("../services/auditService");
const { validate } = require("../middleware/validation");
const StaffAssignment = require("../models/StaffAssignment");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("staff"));

const verifyClassScope = async (req, res, next) => {
  const classId = req.params.id || req.query.classId;
  if (!classId) return next();

  if (req.user.classId === classId) {
    return next();
  }

  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(403).json({ error: "Access denied: class scope not assigned to you" });
  }

  const assignment = await StaffAssignment.findOne({
    staffId: req.user.userId,
    classId,
    isActive: true,
  });

  if (!assignment) {
    return res.status(403).json({ error: "Access denied: class scope not assigned to you" });
  }

  req.staffAssignment = assignment;
  next();
};

router.get("/my-classes", async (req, res, next) => {
  try {
    const assignments = await StaffAssignment.find({
      staffId: req.user.userId,
      isActive: true,
    })
      .populate("classId", "name code")
      .sort({ assignedAt: -1 });

    res.json({ classes: assignments.map((a) => a.classId) });
  } catch (err) {
    next(err);
  }
});

router.get("/classes/:id/live", verifyClassScope, async (req, res, next) => {
  try {
    const data = await classService.getClassLiveStatus(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/classes/:id/activity", verifyClassScope, async (req, res, next) => {
  try {
    const { startDate, endDate, studentId } = req.query;
    const data = await classService.getStudentActivity(
      req.params.id,
      studentId,
      startDate,
      endDate
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET: Retrieve rules targeting a class
router.get("/classes/:id/rules", verifyClassScope, async (req, res, next) => {
  try {
    const rules = await ruleService.getRules({ targetClassId: req.params.id });
    res.json(rules);
  } catch (err) {
    next(err);
  }
});

// POST: Create a rule for a class
router.post("/classes/:id/rules", verifyClassScope, validate("createRule"), async (req, res, next) => {
  try {
    req.body.targetClassId = req.params.id;
    if (req.user.institutionId) {
      req.body.institutionId = req.user.institutionId;
    }
    const rule = await ruleService.createRule(req.body, req.user.userId);
    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "rule.create",
      { type: "rule", id: rule._id },
      { targetClassId: rule.targetClassId },
      req.user.institutionId || rule.institutionId
    );
    res.status(201).json(rule);
  } catch (err) {
    next(err);
  }
});

// PATCH: Update a rule for a class
router.patch("/classes/:id/rules/:ruleId", verifyClassScope, validate("updateRule"), async (req, res, next) => {
  try {
    const Rule = require("../models/Rule");
    const ruleCheck = await Rule.findOne({ _id: req.params.ruleId, targetClassId: req.params.id });
    if (!ruleCheck) {
      return res.status(404).json({ error: "Rule not found or does not target this class" });
    }

    const rule = await ruleService.updateRule(req.params.ruleId, req.body, req.user.userId, req.user.institutionId);
    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "rule.update",
      { type: "rule", id: rule._id },
      { targetClassId: rule.targetClassId },
      req.user.institutionId || rule.institutionId
    );
    res.json(rule);
  } catch (err) {
    next(err);
  }
});

// POST: Execute command (start/pause/stop) on a rule
router.post("/classes/:id/rules/:ruleId/command", verifyClassScope, async (req, res, next) => {
  try {
    const { action } = req.body;
    if (!action || !["start", "pause", "stop"].includes(action)) {
      return res.status(400).json({ error: "Invalid or missing action. Must be start, pause, or stop." });
    }

    const Rule = require("../models/Rule");
    const ruleCheck = await Rule.findOne({ _id: req.params.ruleId, targetClassId: req.params.id });
    if (!ruleCheck) {
      return res.status(404).json({ error: "Rule not found or does not target this class" });
    }

    const rule = await ruleService.sendCommand(req.params.ruleId, action, req.user.userId, req.user.institutionId);
    await auditService.logAction(
      req.user.userId,
      req.user.role,
      `rule.${action}`,
      { type: "rule", id: rule._id },
      { targetClassId: rule.targetClassId },
      req.user.institutionId || rule.institutionId
    );
    res.json(rule);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
