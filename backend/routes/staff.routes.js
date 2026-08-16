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

  const User = require("../models/User");
  const ClassRoom = require("../models/ClassRoom");

  const staffUser = await User.findById(req.user.userId || req.user.id || req.user._id);
  if (!staffUser || staffUser.role !== "staff") {
    return res.status(403).json({ error: "Access denied: user is not a staff member" });
  }

  const mongoose = require("mongoose");
  let classroom = null;
  if (mongoose.Types.ObjectId.isValid(classId)) {
    classroom = await ClassRoom.findById(classId);
  } else {
    classroom = await ClassRoom.findOne({ code: classId });
  }

  if (!classroom) {
    if (staffUser.classId === classId) {
      return next();
    }
    return res.status(403).json({ error: "Access denied: class scope not assigned to you" });
  }

  const classroomYearStr = classroom.academicYearId ? classroom.academicYearId.toString() : null;
  const staffYearStr = staffUser.academicYearId ? staffUser.academicYearId.toString() : null;

  const classroomSectionStr = classroom.sectionId ? classroom.sectionId.toString() : null;
  const staffSectionStr = staffUser.sectionId ? staffUser.sectionId.toString() : null;

  if (classroomYearStr !== staffYearStr || classroomSectionStr !== staffSectionStr) {
    if (staffUser.classId === classId) {
      return next();
    }
    return res.status(403).json({ error: "Access denied: classroom is outside your assigned Year and Section scope" });
  }

  next();
};

router.get("/my-classes", async (req, res, next) => {
  try {
    const User = require("../models/User");
    const ClassRoom = require("../models/ClassRoom");

    const staffUser = await User.findById(req.user.userId || req.user.id || req.user._id);
    if (!staffUser || staffUser.role !== "staff") {
      return res.status(403).json({ error: "Access denied: user is not a staff member" });
    }

    let classrooms = [];
    if (staffUser.academicYearId && staffUser.sectionId) {
      classrooms = await ClassRoom.find({
        academicYearId: staffUser.academicYearId,
        sectionId: staffUser.sectionId,
      }).select("name code");
    }

    if (classrooms.length === 0 && staffUser.classId) {
      classrooms = [{
        _id: staffUser.classId,
        name: `Classroom ${staffUser.classId}`,
        code: staffUser.classId,
      }];
    }

    res.json({ classes: classrooms });
  } catch (err) {
    next(err);
  }
});

router.get("/classes/:id/live", verifyClassScope, async (req, res, next) => {
  try {
    const data = await classService.getClassLiveStatus(req.params.id, req.user.userId);
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
      endDate,
      req.user.userId
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
router.post("/classes/:id/rules", verifyClassScope, (req, res, next) => {
  // Inject targetClassId from URL so validate("createRule") sees it
  req.body.targetClassId = req.params.id;
  next();
}, validate("createRule"), async (req, res, next) => {
  try {
    const { setEmergencyUnblock, setClassEmergencyUnblock } = require("../utils/emergencyHelper");
    setEmergencyUnblock(false);
    setClassEmergencyUnblock(req.params.id, false);

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
    const { setEmergencyUnblock, setClassEmergencyUnblock } = require("../utils/emergencyHelper");
    setEmergencyUnblock(false);
    setClassEmergencyUnblock(req.params.id, false);

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

    const { setEmergencyUnblock } = require("../utils/emergencyHelper");
    if (action === "start") {
      setEmergencyUnblock(false);
      const { setClassEmergencyUnblock } = require("../utils/emergencyHelper");
      setClassEmergencyUnblock(req.params.id, false);
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

// POST: Pause restriction for a class (unblock all apps for that class)
router.post("/classes/:id/override/pause", verifyClassScope, async (req, res, next) => {
  try {
    const Rule = require("../models/Rule");
    const activeRules = await Rule.find({ targetClassId: req.params.id, status: "active" });

    for (const rule of activeRules) {
      await ruleService.sendCommand(rule._id, "pause", req.user.userId, req.user.institutionId);
    }

    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "rule.pause",
      { type: "class", id: req.params.id },
      { reason: "Staff paused class restriction" },
      req.user.institutionId
    );

    res.json({
      success: true,
      override: "paused",
      classId: req.params.id,
      affectedRules: activeRules.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST: Resume restriction for a class (re-block apps for that class)
router.post("/classes/:id/override/resume", verifyClassScope, async (req, res, next) => {
  try {
    const Rule = require("../models/Rule");
    const { setClassEmergencyUnblock } = require("../utils/emergencyHelper");
    setClassEmergencyUnblock(req.params.id, false);

    const pausedRules = await Rule.find({ targetClassId: req.params.id, status: "paused" });

    for (const rule of pausedRules) {
      await ruleService.sendCommand(rule._id, "start", req.user.userId, req.user.institutionId);
    }

    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "rule.start",
      { type: "class", id: req.params.id },
      { reason: "Staff resumed class restriction" },
      req.user.institutionId
    );

    res.json({
      success: true,
      override: "resumed",
      classId: req.params.id,
      affectedRules: pausedRules.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST: Emergency Unblock All (staff-scoped to their assigned classes only)
router.post("/emergency-unblock-all", async (req, res, next) => {
  try {
    const User = require("../models/User");
    const ClassRoom = require("../models/ClassRoom");
    const Rule = require("../models/Rule");
    const Device = require("../models/Device");
    const StaffAssignment = require("../models/StaffAssignment");
    const auditService = require("../services/auditService");
    const { emitToClass } = require("../config/socket");
    const { setClassEmergencyUnblock } = require("../utils/emergencyHelper");

    const staffUser = await User.findById(req.user.userId || req.user.id || req.user._id);
    if (!staffUser || staffUser.role !== "staff") {
      return res.status(403).json({ error: "Access denied: user is not a staff member" });
    }

    let classIds = [];
    if (staffUser.academicYearId && staffUser.sectionId) {
      const classrooms = await ClassRoom.find({
        academicYearId: staffUser.academicYearId,
        sectionId: staffUser.sectionId,
      }).select("_id");
      classIds = classrooms.map((c) => c._id.toString());
    }
    const assignments = await StaffAssignment.find({ staffId: staffUser._id, isActive: true }).select("classId");
    classIds = [...new Set([...classIds, ...assignments.map((a) => a.classId), staffUser.classId].filter(Boolean))];

    if (classIds.length === 0) {
      return res.status(403).json({ error: "No assigned classes found for this staff member" });
    }

    for (const classId of classIds) {
      setClassEmergencyUnblock(classId, true);
    }

    await Rule.updateMany({ targetClassId: { $in: classIds } }, { $set: { status: "paused" } });

    const students = await User.find({ classId: { $in: classIds }, role: "student" }).select("_id");
    const studentIds = students.map((s) => s._id);
    if (studentIds.length > 0) {
      await Device.updateMany({ userId: { $in: studentIds } }, { $set: { status: "active" } });
    }

    for (const classId of classIds) {
      emitToClass(classId, "emergency:unblock_all", { timestamp: new Date(), scope: "class" });
    }

    await auditService.logAction(
      req.user.userId,
      req.user.role,
      "emergency_unblock_all",
      { scope: "ASSIGNED_CLASSES", classIds },
      { status: "CLASS_DEVICES_UNBLOCKED_BY_STAFF" },
      req.user.institutionId
    );

    res.json({
      success: true,
      message: `EMERGENCY UNBLOCK EXECUTED: Restrictions lifted for ${classIds.length} assigned class(es).`,
      scope: "assigned-classes",
      classIds,
    });
  } catch (err) {
    next(err);
  }
});

// GET: Fetch staff notifications (compliance alerts, system alerts, broadcasts)
router.get("/notifications", async (req, res, next) => {
  try {
    const Notification = require("../models/Notification");
    const User = require("../models/User");
    const ClassRoom = require("../models/ClassRoom");

    const staffUser = await User.findById(req.user.userId || req.user.id || req.user._id);
    let dbNotifications = [];

    if (staffUser) {
      dbNotifications = await Notification.find({
        $or: [
          { recipientRole: "staff" },
          { recipientRole: "all" },
          { studentId: req.user.userId },
        ],
      }).sort({ createdAt: -1 }).limit(50);
    }

    // Determine staff classrooms to query live status & compliance alerts
    let classroomsToQuery = [];
    if (staffUser?.academicYearId && staffUser?.sectionId) {
      classroomsToQuery = await ClassRoom.find({
        academicYearId: staffUser.academicYearId,
        sectionId: staffUser.sectionId,
      });
    }
    if (classroomsToQuery.length === 0 && staffUser?.classId) {
      classroomsToQuery = [{ _id: staffUser.classId, name: `Classroom ${staffUser.classId}` }];
    }

    let complianceAlerts = [];
    for (const cr of classroomsToQuery) {
      try {
        const liveStatus = await classService.getClassLiveStatus(cr._id.toString(), req.user.userId);
        if (liveStatus && liveStatus.alerts) {
          liveStatus.alerts.forEach((alt, idx) => {
            complianceAlerts.push({
              id: `comp-alert-${cr._id}-${idx}`,
              type: "Device Warning",
              title: "Compliance Alert",
              message: alt.message,
              target: cr.name || "My Class",
              time: "Just now",
              isRead: false,
              icon: "warning",
              iconColor: "#EF4444",
              iconBg: "#FEE2E2",
            });
          });
        }
      } catch (e) {
        // ignore
      }
    }

    const formattedDb = dbNotifications.map((n) => {
      let icon = "campaign";
      let iconColor = "#2563EB";
      let iconBg = "#EFF6FF";

      if (n.type === "restriction") {
        icon = "phonelink-erase";
        iconColor = "#EF4444";
        iconBg = "#FEE2E2";
      } else if (n.type === "system") {
        icon = "dns";
        iconColor = "#16A34A";
        iconBg = "#DCFCE7";
      }

      const diffMs = Date.now() - new Date(n.createdAt).getTime();
      const diffMins = Math.max(1, Math.round(diffMs / 60000));
      const timeStr = diffMins < 60 ? `${diffMins}m ago` : `${Math.round(diffMins / 60)}h ago`;

      return {
        id: n._id.toString(),
        type: n.type === "restriction" ? "Device Warning" : n.type === "system" ? "System Alert" : "Broadcast",
        title: n.title,
        message: n.message,
        target: n.metadata?.target || "All",
        time: timeStr,
        deliveredCount: n.metadata?.deliveredCount || 0,
        readCount: n.metadata?.readCount || 0,
        status: n.type === "restriction" ? "Action Required" : "Delivered",
        isRead: n.read,
        icon,
        iconColor,
        iconBg,
      };
    });

    res.json([...complianceAlerts, ...formattedDb]);
  } catch (err) {
    next(err);
  }
});

router.delete("/notifications/:id", async (req, res, next) => {
  try {
    const Notification = require("../models/Notification");
    await Notification.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post("/notifications/mark-read", async (req, res, next) => {
  try {
    const Notification = require("../models/Notification");
    await Notification.updateMany({ recipientRole: "staff" }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

