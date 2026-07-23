const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const classService = require("../services/classService");
const StaffAssignment = require("../models/StaffAssignment");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("staff"));

const verifyClassScope = async (req, res, next) => {
  const classId = req.params.id || req.query.classId;
  if (!classId) return next();

  const assignment = await StaffAssignment.findOne({
    staffId: req.user.userId,
    classId,
    isActive: true,
  });

  if (!assignment) {
    return res.status(403).json({ error: "Access denied: class not assigned to you" });
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

module.exports = router;
